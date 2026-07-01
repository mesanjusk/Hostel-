import "server-only";

import { connectDB } from "@/lib/db";
import { BroadcastLog } from "@/models/BroadcastLog";
import type { BroadcastInput } from "@/lib/validations/admin";

export async function listBroadcastLogs() {
  await connectDB();
  return BroadcastLog.find().sort({ createdAt: -1 }).limit(20).lean();
}

export async function recordBroadcast(
  createdBy: string,
  input: BroadcastInput,
  sentCount: number,
  failedCount: number,
) {
  await connectDB();
  return BroadcastLog.create({ ...input, createdBy, sentCount, failedCount });
}
