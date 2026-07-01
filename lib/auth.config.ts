import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types";

/**
 * Edge-safe base config (no Mongoose/Node-only imports) shared by middleware and the
 * full server-side auth config. Keeping this split prevents the Credentials provider's
 * DB dependency from being bundled into the edge middleware runtime.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.mobile = user.mobile;
        token.role = user.role;
        token.needsOnboarding = user.needsOnboarding;
      }
      if (trigger === "update" && session?.needsOnboarding === false) {
        token.needsOnboarding = false;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.mobile = token.mobile as string;
      session.user.role = token.role as UserRole;
      session.user.needsOnboarding = token.needsOnboarding as boolean;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
