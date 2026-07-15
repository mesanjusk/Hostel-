import { Router } from "express";

import { uploadImageSchema, uploadFileSchema } from "@/validations/upload";
import { uploadImage, uploadChatFile } from "@/services/uploadService";
import { requireAuth } from "@/middleware/auth";
import { checkRateLimit } from "@/lib/rateLimiter";

export const uploadRouter = Router();

uploadRouter.use(requireAuth);

uploadRouter.post("/image", async (req, res) => {
  const parsed = uploadImageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const { url, publicId } = await uploadImage(req.user!._id.toString(), parsed.data.image);
    res.json({ url, publicId });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    res.status(502).json({ error: "Failed to upload image" });
  }
});

// Chat attachments (images, video, PDFs/docs, voice notes) — shared by community chat and DMs.
uploadRouter.post("/chat-file", async (req, res) => {
  if (!checkRateLimit(`upload:${req.user!._id.toString()}`, 15, 60_000)) {
    res.status(429).json({ error: "Too many uploads. Please slow down." });
    return;
  }
  const parsed = uploadFileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  try {
    const attachment = await uploadChatFile(req.user!._id.toString(), parsed.data.file, parsed.data.name);
    res.json({ attachment });
  } catch (error) {
    console.error("Cloudinary chat upload failed:", error);
    res.status(502).json({ error: "Failed to upload file" });
  }
});
