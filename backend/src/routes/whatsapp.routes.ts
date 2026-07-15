import crypto from "crypto";

import { Router, type Request } from "express";

import { completeRegistrationFromWhatsApp, completeResendFromWhatsApp } from "@/services/waRegisterService";

export const whatsappRouter = Router();

/** The one entry keyword this app owns on the shared WhatsApp number.
 * Metabsp fans the same number out to unrelated projects, so we respond ONLY
 * when a message starts with this keyword or the sender already has an active
 * session that was opened by it. Generic words (HI, HELLO, START, MENU, HELP,
 * STOP, YES, NO, OK...) are banned as entry triggers across all projects —
 * they may only be meaningful inside an active session. */
const ENTRY_KEYWORD = "HOSTEL";
const EXIT_KEYWORD = "EXIT";
const SESSION_TTL_MS = 30 * 60 * 1000;

/** In-memory session + dedupe state.
 *
 * Deliberately NOT persisted: the Atlas cluster is at its collection cap (see
 * the note on User.loginAttempts), and until the keyword handlers are wired up
 * the only cost of losing this state on restart is that a sender re-types
 * HOSTEL. Revisit if/when real conversation flows land here. */
const activeSessions = new Map<string, number>(); // phone -> lastActivity epoch ms
const processedMessageIds = new Map<string, number>(); // messageId -> firstSeen epoch ms
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;

function pruneExpired(): void {
  const now = Date.now();
  for (const [phone, lastActivity] of activeSessions) {
    if (now - lastActivity >= SESSION_TTL_MS) activeSessions.delete(phone);
  }
  for (const [messageId, firstSeen] of processedMessageIds) {
    if (now - firstSeen >= DEDUPE_TTL_MS) processedMessageIds.delete(messageId);
  }
}

// Self-prune on a timer instead of relying solely on webhook traffic to trigger pruneExpired()
// — otherwise these maps only shrink in response to more of the exact traffic causing growth.
setInterval(pruneExpired, 5 * 60 * 1000).unref();

interface MetabspPayload {
  fromMe?: boolean;
  from?: string;
  to?: string;
  message?: string;
  text?: string;
  type?: string;
  direction?: string;
  messageId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

function verifySignature(req: Request): boolean {
  const secret = process.env.METABSP_WEBHOOK_SECRET;
  const signatureHeader = req.headers["x-metabsp-signature-256"];
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!secret || typeof signatureHeader !== "string" || !rawBody) {
    return false;
  }

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signatureHeader);
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

/** Matches the /wa-login self-registration message, e.g.
 * "Register me as 9876543210, my PIN is 1234". Distinct enough a phrase (not a banned
 * generic single word) that it's safe to handle ahead of the HOSTEL keyword gate below,
 * independent of any active pack-with-me session. */
const REGISTER_MESSAGE_REGEX = /register me as\s*[:\-]?\s*(\+?\d{10,13})\s*,?\s*(?:and\s*)?my pin is\s*[:\-]?\s*(\d{4})/i;

/** Matches the /wa-login "already registered" branch's message, e.g.
 * "Send my code for 9876543210" — sent instead of the register message when the visitor
 * typed a mobile number that already has an account. */
const RESEND_MESSAGE_REGEX = /send my code for\s*[:\-]?\s*(\+?\d{10,13})/i;

/** Best-effort extraction of the sender's WhatsApp profile display name. Metabsp's exact
 * field for this hasn't been confirmed against a live payload yet — this tries the likely
 * candidates and falls back to null (registration still succeeds; only the onboarding-page
 * name prefill is affected). Check the payload log below once a real message comes through
 * and adjust the field name here if needed. */
function extractProfileName(payload: MetabspPayload): string | null {
  const candidate =
    payload.senderName ?? payload.pushName ?? payload.profileName ?? payload.contactName ?? payload.name;
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

/** Returns the text after the entry keyword ("" for a bare keyword), or null
 * when the message does not start with it. */
function matchEntryKeyword(text: string): string | null {
  const upper = text.trim().toUpperCase();
  if (upper === ENTRY_KEYWORD) return "";
  if (upper.startsWith(`${ENTRY_KEYWORD} `)) return text.trim().slice(ENTRY_KEYWORD.length).trim();
  return null;
}

function hasActiveSession(phone: string): boolean {
  const lastActivity = activeSessions.get(phone);
  return typeof lastActivity === "number" && Date.now() - lastActivity < SESSION_TTL_MS;
}

async function processMetabspMessage(payload: MetabspPayload): Promise<void> {
  try {
    // Metabsp also forwards the bot's own outbound sends back through this webhook
    // (and fans the same WhatsApp number out to unrelated projects) — only handle
    // genuine inbound messages.
    if (payload.fromMe || (payload.direction && payload.direction !== "incoming")) {
      return;
    }

    pruneExpired();

    // Dedupe: skip a messageId we've already processed (Metabsp/Meta retry
    // deliveries on slow responses).
    const messageId = String(payload.messageId ?? "");
    if (messageId) {
      if (processedMessageIds.has(messageId)) {
        return;
      }
      processedMessageIds.set(messageId, Date.now());
    }

    const from = String(payload.from ?? "").replace(/\D/g, "");
    const text = String(payload.text ?? payload.message ?? "");
    if (!from) {
      return;
    }

    // /wa-login self-registration: handled independently of the HOSTEL keyword gate and
    // any active session below — it's a one-shot handshake with the web form, not a
    // pack-with-me conversation.
    const registerMatch = text.match(REGISTER_MESSAGE_REGEX);
    if (registerMatch) {
      const [, typedMobile, pin] = registerMatch;
      const profileName = extractProfileName(payload);
      console.log("wa-login registration attempt:", { from, typedMobile, payloadKeys: Object.keys(payload) });
      await completeRegistrationFromWhatsApp(from, typedMobile, pin, profileName);
      return;
    }

    // /wa-login "send my code" (already-registered branch): same independence from the
    // HOSTEL gate/session state as registration above.
    const resendMatch = text.match(RESEND_MESSAGE_REGEX);
    if (resendMatch) {
      const [, typedMobile] = resendMatch;
      await completeResendFromWhatsApp(from, typedMobile);
      return;
    }

    // Keyword gate: the entry keyword opens (or refreshes) a session; anything
    // else is only ours while the sender's session is alive. No known-user
    // fallback — being registered in this app must not claim the conversation.
    const keywordRemainder = matchEntryKeyword(text);
    if (keywordRemainder === null && !hasActiveSession(from)) {
      return;
    }

    if (text.trim().toUpperCase() === EXIT_KEYWORD) {
      activeSessions.delete(from);
      return;
    }

    activeSessions.set(from, Date.now());

    // TODO: wire up actual message-handling behavior (in-session commands like
    // PACK/CHECKLIST/HELP) now that the gate guarantees this message is ours.
    console.log("Metabsp WhatsApp message for pack-with-me:", {
      from,
      text: keywordRemainder !== null && keywordRemainder !== "" ? keywordRemainder : text,
      messageId: payload.messageId,
    });
  } catch (error) {
    console.error("Failed to process Metabsp WhatsApp message:", error);
  }
}

whatsappRouter.get("/webhook-metabsp", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

whatsappRouter.post("/webhook-metabsp", (req, res) => {
  if (!verifySignature(req)) {
    res.status(403).json({ error: "Invalid signature" });
    return;
  }

  res.status(200).json({ received: true });

  setImmediate(() => {
    void processMetabspMessage(req.body as MetabspPayload);
  });
});
