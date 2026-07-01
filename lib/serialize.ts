import type { Types } from "mongoose";

type Plain<T> = T extends Date
  ? string
  : T extends Types.ObjectId
    ? string
    : T extends (infer U)[]
      ? Plain<U>[]
      : T extends object
        ? { [K in keyof T]: Plain<T[K]> }
        : T;

/** Converts lean Mongoose documents (ObjectId/Date) into plain JSON-safe objects for client components. */
export function toPlain<T>(doc: T): Plain<T> {
  return JSON.parse(JSON.stringify(doc));
}
