import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

const PIN_LENGTH = 7;
const BCRYPT_ROUNDS = 10;

/** A random 7-digit numeric login code, e.g. "0453981". */
export function generatePin(): string {
  const min = 10 ** (PIN_LENGTH - 1);
  const max = 10 ** PIN_LENGTH;
  return randomInt(min, max).toString();
}

export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
