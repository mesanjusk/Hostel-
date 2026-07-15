import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let conn: typeof mongoose | null = null;
let promise: Promise<typeof mongoose> | null = null;
let listenersAttached = false;

function attachConnectionLogging() {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB connection lost");
  });
  mongoose.connection.on("reconnected", () => {
    console.warn("MongoDB connection re-established");
  });
}

export async function connectDB() {
  if (conn) {
    return conn;
  }

  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  attachConnectionLogging();

  if (!promise) {
    // Explicit pool/timeout tuning instead of the driver defaults: bounds how many concurrent
    // connections one instance opens against Atlas (matters once there's more than one
    // instance) and fails fast on a bad/unreachable cluster instead of hanging indefinitely.
    promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    conn = await promise;
  } catch (error) {
    promise = null;
    throw error;
  }

  return conn;
}
