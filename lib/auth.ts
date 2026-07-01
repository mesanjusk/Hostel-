import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/lib/auth.config";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { consumeLoginTicket } from "@/lib/login-ticket";
import { getOrCreateDevTestUser, verifyDevLoginSecret } from "@/lib/dev-login";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "whatsapp-ticket",
      name: "WhatsApp",
      credentials: {
        token: { label: "Ticket", type: "text" },
        devSecret: { label: "Dev Secret", type: "text" },
      },
      async authorize(credentials) {
        const receivedKeys = credentials ? Object.keys(credentials) : [];
        const devSecretLen =
          typeof credentials?.devSecret === "string" ? credentials.devSecret.length : -1;
        console.log(
          `[auth] authorize called, keys=${JSON.stringify(receivedKeys)} devSecretLen=${devSecretLen}`,
        );

        try {
          // Secret-gated test login — completely inert unless DEV_LOGIN_SECRET is set in
          // the environment. Intended as a temporary way to exercise the app while the
          // real WhatsApp webhook is being configured; remove the env var to disable.
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

          const token = credentials?.token;
          if (!token || typeof token !== "string") {
            console.log("[auth] no usable token/devSecret in credentials, returning null");
            return null;
          }

          const result = await consumeLoginTicket(token);
          if (!result) {
            return null;
          }

          await connectDB();
          const user = await User.findOneAndUpdate(
            { mobile: result.mobile },
            { $setOnInsert: { mobile: result.mobile, role: "student" } },
            { upsert: true, new: true },
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
  ],
});
