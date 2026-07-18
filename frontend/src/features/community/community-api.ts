import { api } from "@/lib/api";
import type {
  ChannelDTO,
  CommunityDTO,
  CommunityStatus,
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

export function removeMember(communityId: string, userId: string) {
  return api.delete(`/api/communities/${communityId}/members/${userId}`);
}

// --- Site-admin community management ---------------------------------------------------

export function adminListCommunities(params: { status?: CommunityStatus; q?: string; page?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page) query.set("page", String(params.page));
  return api.get<{ communities: CommunityDTO[]; total: number }>(`/api/admin/communities?${query.toString()}`);
}

export function adminUpdateCommunity(
  id: string,
  input: { name?: string; description?: string; icon?: string | null; visibility?: string; allowAnonymous?: boolean; isOfficial?: boolean },
) {
  return api.patch<{ community: CommunityDTO }>(`/api/admin/communities/${id}`, input);
}

export function adminApproveCommunity(id: string) {
  return api.post<{ community: CommunityDTO }>(`/api/admin/communities/${id}/approve`);
}

export function adminSuspendCommunity(id: string) {
  return api.post<{ community: CommunityDTO }>(`/api/admin/communities/${id}/suspend`);
}

export function adminDeleteCommunity(id: string) {
  return api.delete(`/api/admin/communities/${id}`);
}

export function adminRestoreCommunity(id: string) {
  return api.post<{ community: CommunityDTO }>(`/api/admin/communities/${id}/restore`);
}

export function adminListCommunityMembers(communityId: string, page = 1) {
  return api.get<{ members: Array<{ userId: PublicUserDTO; role: string; muted: boolean; banned: boolean }>; total: number }>(
    `/api/admin/communities/${communityId}/members?page=${page}`,
  );
}

export function adminAddCommunityMember(communityId: string, mobile: string, role?: string) {
  return api.post(`/api/admin/communities/${communityId}/members`, { mobile, role });
}

export function adminBulkAddCommunityMembers(
  communityId: string,
  filter: { city?: string; college?: string; campus?: string; courseId?: string; all?: boolean; role?: string },
) {
  return api.post<{ matched: number; added: number }>(`/api/admin/communities/${communityId}/members/bulk-add`, filter);
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

export function setPinMessage(messageId: string, pinned: boolean) {
  return api.put(`/api/chat/messages/${messageId}/pin`, { pinned });
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

export function updatePublicProfile(input: {
  displayName?: string;
  avatar?: string | null;
  bio?: string;
  interests?: string[];
  campus?: string;
  year?: string;
}) {
  return api.patch("/api/users/me/public-profile", input);
}

export function setupCommunityProfile(input: {
  useOriginalName: boolean;
  displayName?: string;
  college: string;
  collegeCategoryId: string;
  city: string;
}) {
  return api.patch("/api/users/me/community-profile-setup", input);
}

export function reportContent(input: { targetType: "message" | "user" | "community"; targetId: string; reason: string; note?: string }) {
  return api.post("/api/moderation/reports", input);
}

export function blockUser(userId: string) {
  return api.post(`/api/moderation/block/${userId}`);
}
