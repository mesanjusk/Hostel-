import { createAsyncRouter } from "@/lib/asyncRouter";

import { requireAuth, requireIdentified } from "@/middleware/auth";
import { createGroupConversation, findOrCreateDirectConversation, listConversations } from "@/services/conversationService";
import { createConversationSchema, createDirectConversationSchema } from "@/validations/chat";

export const conversationsRouter = createAsyncRouter();

conversationsRouter.use(requireAuth, requireIdentified);

conversationsRouter.get("/", async (req, res) => {
  const conversations = await listConversations(req.user!._id.toString());
  res.json({ conversations });
});

conversationsRouter.post("/dm", async (req, res) => {
  const parsed = createDirectConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const result = await findOrCreateDirectConversation(req.user!._id.toString(), parsed.data.userId);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ conversation: result.conversation });
});

conversationsRouter.post("/group", async (req, res) => {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const conversation = await createGroupConversation(req.user!._id.toString(), parsed.data.memberIds, parsed.data.name);
  res.json({ conversation });
});
