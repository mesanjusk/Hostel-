import { z } from "zod";

import { REPORT_REASONS, REPORT_TARGET_TYPES } from "@/types";

export const createReportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().trim().min(1),
  reason: z.enum(REPORT_REASONS),
  note: z.string().trim().max(500).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(["resolved", "dismissed", "reviewing"]),
});
