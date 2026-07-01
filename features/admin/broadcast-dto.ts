export interface BroadcastLogDTO {
  id: string;
  message: string;
  audience: "all" | "incomplete-checklist";
  sentCount: number;
  failedCount: number;
  createdAt: string;
}
