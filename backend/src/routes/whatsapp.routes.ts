import crypto from "crypto";

import { Router, type Request } from "express";

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
