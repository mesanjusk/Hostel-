import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let conn: typeof mongoose | null = null;
let promise: Promise<typeof mongoose> | null = null;

export async function connectDB() {
  if (conn) {
    return conn;
  }

  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (!promise) {
    promise = mongoose.connect(MONGODB_URI);
  }

  try {
    conn = await promise;
  } catch (error) {
    promise = null;
    throw error;
  }

  return conn;
}
