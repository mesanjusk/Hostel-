import { z } from "zod";

import { ATTACHMENT_TYPES } from "@/types";

const attachmentSchema = z.object({
  type: z.enum(ATTACHMENT_TYPES),
  url: z.string().trim().min(1).max(2000),
  name: z.string().trim().max(200).optional(),
  size: z.number().min(0).optional().nullable(),
  mimeType: z.string().trim().max(100).optional().nullable(),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().max(4000).optional().default(""),
  attachments: z.array(attachmentSchema).max(10).optional().default([]),
  parentMessageId: z.string().trim().min(1).optional().nullable(),
  isAnonymous: z.boolean().optional().default(false),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const editMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const reactSchema = z.object({
  emoji: z.string().trim().min(1).max(8),
});

export const listMessagesQuerySchema = z.object({
  before: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
});

export const createConversationSchema = z.object({
  memberIds: z.array(z.string().trim().min(1)).min(1).max(50),
  name: z.string().trim().max(80).optional(),
});

export const searchMessagesQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
});
