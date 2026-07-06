import { Router } from "express";

import { requireAdmin, requireAuth } from "@/middleware/auth";
import { getAdminAnalytics } from "@/services/analyticsService";
import {
  adminUpdateUser,
  createUserByAdmin,
  deleteUserByAdmin,
  listUsers,
  regeneratePin,
} from "@/services/userService";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/services/productService";
import {
  createGuideArticle,
  deleteGuideArticle,
  updateGuideArticle,
} from "@/services/guideService";
import {
  createUserByAdminSchema,
  guideArticleSchema,
  guideArticleUpdateSchema,
  productSchema,
  productUpdateSchema,
  updateUserByAdminSchema,
} from "@/validations/admin";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/analytics", async (_req, res) => {
  const analytics = await getAdminAnalytics();
  res.json({ analytics });
});

adminRouter.get("/users", async (req, res) => {
  const page = Number(req.query.page ?? 1) || 1;
  const pageSize = Number(req.query.pageSize ?? 20) || 20;
  const { users, total } = await listUsers(page, pageSize);
  const sanitized = users.map((user) => ({
    id: user._id.toString(),
    name: user.name ?? null,
    mobile: user.mobile,
    college: user.college ?? null,
    hostel: user.hostel ?? null,
    roomNumber: user.roomNumber ?? null,
    role: user.role,
    hasPinSet: Boolean(user.loginPinHash),
    createdAt: (user as unknown as { createdAt: Date }).createdAt.toISOString(),
  }));
  res.json({ users: sanitized, total });
});

adminRouter.post("/users", async (req, res) => {
  const parsed = createUserByAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await createUserByAdmin(parsed.data.mobile);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true, mobile: result.user.mobile, pin: result.pin });
});

adminRouter.patch("/users/:id", async (req, res) => {
  const parsed = updateUserByAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await adminUpdateUser(req.params.id, parsed.data);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

adminRouter.post("/users/:id/regenerate-pin", async (req, res) => {
  const result = await regeneratePin(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true, pin: result.pin });
});

adminRouter.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.user!._id.toString()) {
    res.status(400).json({ error: "You can't delete your own account" });
    return;
  }
  const result = await deleteUserByAdmin(req.params.id);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

adminRouter.post("/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const product = await createProduct(parsed.data);
  res.json({ product });
});

adminRouter.patch("/products/:id", async (req, res) => {
  const parsed = productUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const product = await updateProduct(parsed.data);
  res.json({ product });
});

adminRouter.delete("/products/:id", async (req, res) => {
  await deleteProduct(req.params.id);
  res.json({ success: true });
});

adminRouter.post("/guide", async (req, res) => {
  const parsed = guideArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const article = await createGuideArticle(parsed.data);
  res.json({ article });
});

adminRouter.patch("/guide/:id", async (req, res) => {
  const parsed = guideArticleUpdateSchema.safeParse({ ...req.body, id: req.params.id });
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const article = await updateGuideArticle(parsed.data);
  res.json({ article });
});

adminRouter.delete("/guide/:id", async (req, res) => {
  await deleteGuideArticle(req.params.id);
  res.json({ success: true });
});
