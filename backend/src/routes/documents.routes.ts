import { Router } from "express";

import { documentItemSchema, documentItemUpdateSchema } from "@/validations/document";
import {
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from "@/services/documentService";
import { requireAuth } from "@/middleware/auth";

export const documentsRouter = Router();

documentsRouter.use(requireAuth);

documentsRouter.get("/", async (req, res) => {
  const documents = await listDocuments(req.user!._id.toString());
  res.json({ documents });
});

documentsRouter.post("/", async (req, res) => {
  const parsed = documentItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const document = await createDocument(req.user!._id.toString(), parsed.data);
  res.json({ document });
});

documentsRouter.patch("/:id", async (req, res) => {
  const parsed = documentItemUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const document = await updateDocument(req.user!._id.toString(), parsed.data);
  res.json({ document });
});

documentsRouter.delete("/:id", async (req, res) => {
  await deleteDocument(req.user!._id.toString(), req.params.id);
  res.json({ success: true });
});
