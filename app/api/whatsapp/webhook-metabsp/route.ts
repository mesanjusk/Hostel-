import { createHmac, timingSafeEqual } from "node:crypto";

import { connectDB } from "@/lib/db";
import { normalizeMobile } from "@/lib/phone";
import { generatePin, hashPin } from "@/lib/pin";
import { sendTextMessage } from "@/lib/whatsapp";
import { User } from "@/models/User";
import { WhatsappLog } from "@/models/WhatsappLog";

const LOGIN_URL = "https://packwithme.instify.in/login";

interface MetabspPayload {
  phoneNumberId?: string;
  fromMe?: boolean;
  from: string;
  to?: string;
  message?: string;
  body?: string;
  text?: string;
  timestamp?: string;
  time?: string;
  status?: string;
  direction: string;
  messageId?: string;
  type?: string;
  mediaId?: string;
  interactiveId?: string;
  wabaId?: string;
  businessAccountId?: string;
}

function isValidSignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== actualBuf.length) return false;

  try {
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  try {
    const secret = process.env.METABSP_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[webhook-metabsp] rejected: METABSP_WEBHOOK_SECRET is not set");
      return new Response(JSON.stringify({ message: "Invalid signature" }), { status: 403 });
    }

    const signatureHeader = req.headers.get("x-metabsp-signature-256");
    if (!isValidSignature(rawBody, signatureHeader, secret)) {
      return new Response(JSON.stringify({ message: "Invalid signature" }), { status: 403 });
    }

    const payload = JSON.parse(rawBody) as MetabspPayload;

    if (payload.direction !== "incoming" || payload.fromMe) {
      return Response.json({ received: true });
    }

    await connectDB();

    const from = normalizeMobile(payload.from) ?? payload.from.replace(/\D/g, "");
    const text = String(payload.message || payload.text || "").trim();
    const command = text.toUpperCase();

    const existingUser = await User.findOne({ mobile: from });
    const isCommand = command === "PACK REGISTER" || command === "PACK RESET";

    if (!isCommand && !existingUser) {
      return Response.json({ received: true });
    }

    await WhatsappLog.create({
      direction: "inbound",
      mobile: from,
      type: payload.type || "text",
      body: text,
      status: "received",
      providerMessageId: payload.messageId,
      raw: payload,
    });

    if (command === "PACK REGISTER") {
      if (existingUser) {
        await sendTextMessage(
          from,
          "You already have a Pack With Me account. Send \"PACK RESET\" if you need a new login PIN.",
        );
      } else {
        const pin = generatePin();
        const loginPinHash = await hashPin(pin);
        await User.create({ mobile: from, loginPinHash });

        await sendTextMessage(
          from,
          `Welcome to Pack With Me! Your account (${from}) is ready.\n\nLog in at ${LOGIN_URL} using this PIN: ${pin}\n\nKeep it safe — it won't be shown again.`,
        );
      }
    } else if (command === "PACK RESET") {
      if (!existingUser) {
        await sendTextMessage(from, "No Pack With Me account found for this number yet. Send \"PACK REGISTER\" to create one.");
      } else {
        const pin = generatePin();
        existingUser.loginPinHash = await hashPin(pin);
        existingUser.loginAttempts = [];
        await existingUser.save();

        await sendTextMessage(
          from,
          `Your new Pack With Me login PIN is: ${pin}\n\nLog in at ${LOGIN_URL}. Keep it safe — it won't be shown again.`,
        );
      }
    } else {
      console.error("[webhook-metabsp] known user sent unrecognized command", { from, text });
      await sendTextMessage(
        from,
        "Sorry, I didn't understand that. Send \"PACK REGISTER\" to create an account or \"PACK RESET\" to get a new login PIN.",
      );
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error("[webhook-metabsp] unhandled error", error);
    return Response.json({ received: true });
  }
}

export async function GET() {
  return Response.json({ ok: true });
}
