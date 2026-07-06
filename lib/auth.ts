import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyMsg91AccessToken } from "@/lib/msg91";
import { getOrCreateDevTestUser, verifyDevLoginSecret } from "@/lib/dev-login";
import { authenticateWithPin, RateLimitedError } from "@/lib/pin-login";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "msg91-otp",
      name: "Mobile OTP",
      credentials: {
        accessToken: { label: "Access token", type: "text" },
        devSecret: { label: "Dev Secret", type: "text" },
      },
      async authorize(credentials) {
        try {
          // Secret-gated test login — completely inert unless DEV_LOGIN_SECRET is set in
          // the environment. Intended as a temporary way to exercise the app while the
          // real MSG91 widget is being configured; remove the env var to disable.
          if (verifyDevLoginSecret(credentials?.devSecret)) {
            console.warn("[dev-login] Secret-gated test login used");
            const testUser = await getOrCreateDevTestUser();
            return {
              id: testUser._id.toString(),
              mobile: testUser.mobile,
              name: testUser.name ?? null,
              role: testUser.role,
              needsOnboarding: !testUser.name,
            };
          }

          const accessToken = credentials?.accessToken;
          if (!accessToken || typeof accessToken !== "string") {
            return null;
          }

          const mobile = await verifyMsg91AccessToken(accessToken);
          if (!mobile) {
            return null;
          }

          await connectDB();
          const user = await User.findOneAndUpdate(
            { mobile },
            { $setOnInsert: { mobile, role: "student" } },
            { upsert: true, returnDocument: "after" },
          );

          return {
            id: user._id.toString(),
            mobile: user.mobile,
            name: user.name ?? null,
            role: user.role,
            needsOnboarding: !user.name,
          };
        } catch (error) {
          console.error("[auth] authorize threw:", error);
          throw error;
        }
      },
    }),
    Credentials({
      id: "mobile-pin",
      name: "Mobile + code",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        pin: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const mobile = credentials?.mobile;
        const pin = credentials?.pin;
        if (!mobile || typeof mobile !== "string" || !pin || typeof pin !== "string") {
          return null;
        }

        try {
          const user = await authenticateWithPin(mobile, pin);
          if (!user) {
            return null;
          }

          return {
            id: user._id.toString(),
            mobile: user.mobile,
            name: user.name ?? null,
            role: user.role,
            needsOnboarding: !user.name,
          };
        } catch (error) {
          if (!(error instanceof RateLimitedError)) {
            console.error("[auth] mobile-pin authorize threw:", error);
          }
          throw error;
        }
      },
    }),
  ],
});
