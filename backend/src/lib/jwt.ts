import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "30d";

export function signAuthToken(userId: string): string {
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL, algorithm: "HS256" });
}

export function verifyAuthToken(token: string): { sub: string } {
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as { sub: string };
}
