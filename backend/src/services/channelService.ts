import { connectDB } from "@/db";
import { Channel } from "@/models/Channel";
import { slugify } from "@/lib/slug";

export async function listChannels(communityId: string) {
  await connectDB();
  return Channel.find({ communityId, archived: false }).sort({ order: 1, createdAt: 1 }).lean();
}

export async function getChannel(communityId: string, channelId: string) {
  await connectDB();
  return Channel.findOne({ _id: channelId, communityId, archived: false });
}

export async function createChannel(
  communityId: string,
  input: { name: string; topic?: string; allowAnonymous?: boolean },
) {
  await connectDB();
  const slug = slugify(input.name);
  const existing = await Channel.findOne({ communityId, slug });
  if (existing) return { success: false as const, error: "A channel with this name already exists" };

  const count = await Channel.countDocuments({ communityId });
  const channel = await Channel.create({
    communityId,
    name: input.name,
    slug,
    topic: input.topic ?? "",
    allowAnonymous: input.allowAnonymous ?? false,
    order: count,
  });
  return { success: true as const, channel };
}

export async function archiveChannel(communityId: string, channelId: string) {
  await connectDB();
  const channel = await Channel.findOneAndUpdate({ _id: channelId, communityId, isDefault: false }, { archived: true });
  return { success: Boolean(channel) };
}
