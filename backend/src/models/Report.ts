import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { REPORT_REASONS, REPORT_STATUSES, REPORT_TARGET_TYPES } from "@/types";

const ReportSchema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: REPORT_TARGET_TYPES, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, default: "", trim: true, maxlength: 500 },
    status: { type: String, enum: REPORT_STATUSES, default: "open" },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1 });

export type ReportDocument = InferSchemaType<typeof ReportSchema>;

export const Report: Model<ReportDocument> = models.Report || model<ReportDocument>("Report", ReportSchema);
