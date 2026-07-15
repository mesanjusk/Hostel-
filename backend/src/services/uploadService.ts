import { cloudinary } from "@/lib/cloudinary";
import type { AttachmentType } from "@/types";

/** Uploads a data-URI image to Cloudinary, scoped to the uploading user's own folder,
 * and returns the hosted secure URL to store in place of the raw base64 blob. */
export async function uploadImage(userId: string, dataUri: string) {
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `hostel-checklist/${userId}`,
  });

  return { url: result.secure_url, publicId: result.public_id };
}

function attachmentTypeFromMime(mime: string): AttachmentType {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

/** Uploads any chat attachment (image, video, PDF/document, or a recorded voice note) — uses
 * Cloudinary's "auto" resource type so one endpoint covers every attachment kind instead of
 * duplicating the image-only upload path above. */
export async function uploadChatFile(userId: string, dataUri: string, name?: string) {
  const mime = dataUri.slice(5, dataUri.indexOf(";"));
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `hostel-chat/${userId}`,
    resource_type: "auto",
  });

  return {
    type: attachmentTypeFromMime(mime),
    url: result.secure_url,
    name: name ?? "",
    size: result.bytes ?? null,
    mimeType: mime || null,
  };
}
