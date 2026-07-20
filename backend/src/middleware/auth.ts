import type { NextFunction, Request, Response } from "express";

import { connectDB } from "@/db";
import { User, type UserDocument } from "@/models/User";
import { verifyAuthToken } from "@/lib/jwt";
import type { HydratedDocument } from "mongoose";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: HydratedDocument<UserDocument>;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    await connectDB();
    const user = await User.findById(payload.sub);
    // A missing `tv` claim (tokens signed before tokenVersion existed) is treated as 0, matching
    // the field's default — this is what lets already-issued tokens keep working after deploy.
    // A PIN reset/regenerate bumps User.tokenVersion, which immediately invalidates every token
    // signed before that point, without waiting for the token's own 30-day expiry.
    if (!user || (payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
}

/** Resolves req.user from a bearer token when present and valid, but never rejects the
 * request — used by public endpoints (like analytics event collection) that need to know
 * "who, if anyone, is logged in" without requiring a session. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    await connectDB();
    const user = await User.findById(payload.sub);
    if (user && (payload.tv ?? 0) === (user.tokenVersion ?? 0)) req.user = user;
  } catch {
    // Invalid/expired token on a public endpoint — just proceed anonymously.
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  next();
}

/** Gates the social/messaging surface (chat, community, roommate discovery, connections) behind
 * an actually-linked mobile number — every other feature works for a purely anonymous visitor,
 * but messaging strangers or joining a community as a throwaway unidentified account is an abuse
 * vector the rest of the app doesn't have. Must run after requireAuth (needs req.user). */
export function requireIdentified(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.mobile) {
    res.status(403).json({ error: "Link your mobile number to use this feature.", code: "IDENTIFICATION_REQUIRED" });
    return;
  }
  next();
}
