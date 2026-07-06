import { normalizeMobile } from "@/lib/phone";

const VERIFY_URL = "https://control.msg91.com/api/v5/widget/verifyAccessToken";

interface Msg91VerifyResponse {
  type: "success" | "error";
  message: string;
}

/**
 * Verifies a widget access-token server-side against MSG91 and returns the verified
 * mobile number in the app's normalized "91XXXXXXXXXX" form, or null if the token is
 * invalid/expired/unparseable.
 */
export async function verifyMsg91AccessToken(accessToken: string): Promise<string | null> {
  const authkey = process.env.MSG91_AUTH_KEY;
  if (!authkey) {
    throw new Error("Missing MSG91_AUTH_KEY environment variable");
  }

  const response = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ authkey, "access-token": accessToken }),
  });

  const data = (await response.json().catch(() => null)) as Msg91VerifyResponse | null;

  if (!response.ok || !data || data.type !== "success") {
    return null;
  }

  return normalizeMobile(data.message);
}
