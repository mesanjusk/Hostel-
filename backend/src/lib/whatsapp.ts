const GRAPH_BASE = "https://graph.facebook.com";

export class WhatsAppConfigError extends Error {}

function getConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    throw new WhatsAppConfigError(
      "WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set to send WhatsApp messages",
    );
  }
  return {
    accessToken,
    phoneNumberId,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v18.0",
  };
}

/**
 * Sends a WhatsApp OTP via an approved Authentication-category template. A brand-new
 * contact has no open 24h conversation window with the business number, so free-form
 * text is rejected by the Graph API — the template is the only way to reach them.
 */
export async function sendWhatsAppOtp(mobile: string, code: string): Promise<void> {
  const { accessToken, phoneNumberId, apiVersion } = getConfig();
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || "instify_otp";
  const templateLanguage = process.env.WHATSAPP_OTP_TEMPLATE_LANGUAGE || "en_US";

  const res = await fetch(`${GRAPH_BASE}/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: mobile,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
        ],
      },
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    const message = body?.error?.message || `WhatsApp send failed with status ${res.status}`;
    throw new Error(message);
  }
}
