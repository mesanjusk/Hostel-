import { Router } from "express";

import { requireAuth } from "@/middleware/auth";
import { getPublicProfileByUsername } from "@/services/communityService";
import { User } from "@/models/User";
import { isValidUsernameFormat } from "@/lib/username";
import { usernameUpdateSchema, publicProfileUpdateSchema } from "@/validations/community";
import { serializeUser } from "@/lib/serialize";

export const usersRouter = Router();

usersRouter.use(requireAuth);

// Public, privacy-safe lookup by username — never exposes name/mobile/city/college beyond
// what serializePublicUser already allows through (see communityService.serializePublicUser).
usersRouter.get("/:username", async (req, res) => {
  if (!isValidUsernameFormat(req.params.username)) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const profile = await getPublicProfileByUsername(req.params.username);
  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ profile });
});

usersRouter.patch("/me/username", async (req, res) => {
  const parsed = usernameUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const clash = await User.findOne({ username: parsed.data.username, _id: { $ne: req.user!._id } }).lean();
  if (clash) {
    res.status(400).json({ error: "That username is already taken" });
    return;
  }
  req.user!.username = parsed.data.username;
  await req.user!.save();
  res.json({ user: serializeUser(req.user!) });
});

usersRouter.patch("/me/public-profile", async (req, res) => {
  const parsed = publicProfileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  Object.assign(req.user!, parsed.data);
  await req.user!.save();
  res.json({ user: serializeUser(req.user!) });
});
