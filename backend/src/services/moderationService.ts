import { connectDB } from "@/db";
import { Report } from "@/models/Report";
import { Message } from "@/models/Message";
import type { ReportReason, ReportStatus, ReportTargetType } from "@/types";

export async function createReport(
  reporterId: string,
  input: { targetType: ReportTargetType; targetId: string; reason: ReportReason; note?: string },
) {
  await connectDB();
  const report = await Report.create({
    reporterId,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    note: input.note ?? "",
  });
  return report;
}

export async function listReports(status?: string) {
  await connectDB();
  const query: { status?: ReportStatus } = {};
  if (status) query.status = status as ReportStatus;
  return Report.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("reporterId", "username displayName")
    .lean();
}

export async function resolveReport(reportId: string, adminId: string, status: "resolved" | "dismissed" | "reviewing") {
  await connectDB();
  const report = await Report.findByIdAndUpdate(
    reportId,
    { status, resolvedBy: adminId, resolvedAt: status === "reviewing" ? null : new Date() },
    { returnDocument: "after" },
  );
  return report;
}

/** Admin-only de-anonymization for moderation. Every call is logged server-side (who looked
 * up which message, and when) since tracing an anonymous poster's identity is a sensitive,
 * auditable action — never exposed to non-admins regardless of community role. */
export async function traceAnonymousAuthor(messageId: string, adminId: string) {
  await connectDB();
  const message = await Message.findById(messageId).populate("authorId", "username mobile name").lean();
  if (!message) return { success: false as const, error: "Message not found" };

  console.warn(`[moderation-trace] admin=${adminId} traced authorId of message=${messageId} at ${new Date().toISOString()}`);
  return { success: true as const, author: message.authorId };
}
