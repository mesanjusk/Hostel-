import { api } from "@/lib/api";
import type {
  ChannelDTO,
  CommunityDTO,
  ConversationDTO,
  MessageDTO,
  MessageScopeType,
  PublicUserDTO,
} from "@/types";

export function listMyCommunities() {
  return api.get<{ communities: CommunityDTO[] }>("/api/communities/mine");
}

export function discoverCommunities(params: { q?: string; type?: string; page?: number }) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.type) query.set("type", params.type);
  if (params.page) query.set("page", String(params.page));
  return api.get<{ communities: CommunityDTO[]; total: number }>(`/api/communities?${query.toString()}`);
}

export function getCommunity(slug: string) {
  return api.get<{ community: CommunityDTO; myRole: string | null; channels: ChannelDTO[] }>(`/api/communities/${slug}`);
}

export function joinCommunity(id: string) {
  return api.post(`/api/communities/${id}/join`);
}

export function leaveCommunity(id: string) {
  return api.post(`/api/communities/${id}/leave`);
}

export function createCommunity(input: { name: string; description?: string; icon?: string; visibility?: string; allowAnonymous?: boolean }) {
  return api.post<{ community: CommunityDTO }>("/api/communities", input);
}

export function listChannels(communityId: string) {
  return api.get<{ channels: ChannelDTO[] }>(`/api/communities/${communityId}/channels`);
}

export function createChannel(communityId: string, input: { name: string; topic?: string; allowAnonymous?: boolean }) {
  return api.post<{ channel: ChannelDTO }>(`/api/communities/${communityId}/channels`, input);
}

export function listMembers(communityId: string, page = 1) {
  return api.get<{ members: Array<{ userId: PublicUserDTO; role: string; muted: boolean; banned: boolean }>; total: number }>(
    `/api/communities/${communityId}/members?page=${page}`,
  );
}

export function updateMemberRole(communityId: string, userId: string, role: string) {
  return api.patch(`/api/communities/${communityId}/members/${userId}/role`, { role });
}

export function setMemberModeration(communityId: string, userId: string, patch: { muted?: boolean; banned?: boolean }) {
  return api.patch(`/api/communities/${communityId}/members/${userId}/moderation`, patch);
}

export function listMessages(scopeType: MessageScopeType, scopeId: string, before?: string) {
  const query = before ? `?before=${before}` : "";
  return api.get<{ messages: MessageDTO[] }>(`/api/chat/${scopeType}/${scopeId}/messages${query}`);
}

export function sendMessageRest(
  scopeType: MessageScopeType,
  scopeId: string,
  input: { body: string; attachments?: MessageDTO["attachments"]; parentMessageId?: string | null; isAnonymous?: boolean },
) {
  return api.post<{ message: MessageDTO }>(`/api/chat/${scopeType}/${scopeId}/messages`, input);
}

export function markScopeRead(scopeType: MessageScopeType, scopeId: string) {
  return api.post(`/api/chat/${scopeType}/${scopeId}/read`);
}

export function listPinnedMessages(channelId: string) {
  return api.get<{ messages: MessageDTO[] }>(`/api/chat/channels/${channelId}/pinned`);
}

export function togglePinMessage(messageId: string) {
  return api.post(`/api/chat/messages/${messageId}/pin`);
}

export function listConversations() {
  return api.get<{ conversations: ConversationDTO[] }>("/api/conversations");
}

export function startDirectConversation(userId: string) {
  return api.post<{ conversation: { _id: string } }>("/api/conversations/dm", { userId });
}

export function getPublicProfile(username: string) {
  return api.get<{ profile: PublicUserDTO }>(`/api/users/${username}`);
}

export function updateUsername(username: string) {
  return api.patch("/api/users/me/username", { username });
}

export function updatePublicProfile(input: { displayName?: string; bio?: string; interests?: string[]; campus?: string; year?: string }) {
  return api.patch("/api/users/me/public-profile", input);
}

export function uploadChatFile(dataUri: string, name?: string) {
  return api.post<{ attachment: MessageDTO["attachments"][number] }>("/api/uploads/chat-file", { file: dataUri, name });
}

export function reportContent(input: { targetType: "message" | "user" | "community"; targetId: string; reason: string; note?: string }) {
  return api.post("/api/moderation/reports", input);
}

export function blockUser(userId: string) {
  return api.post(`/api/moderation/block/${userId}`);
}
