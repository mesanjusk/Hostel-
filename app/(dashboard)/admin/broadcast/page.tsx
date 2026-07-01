import type { Metadata } from "next";

import { listBroadcastLogs } from "@/services/broadcastService";
import { toPlain } from "@/lib/serialize";
import { BroadcastView } from "@/features/admin/broadcast-view";
import type { BroadcastLogDTO } from "@/features/admin/broadcast-dto";

export const metadata: Metadata = { title: "Broadcast — Admin" };

export default async function AdminBroadcastPage() {
  const logs = await listBroadcastLogs();
  const plain = toPlain(logs);

  const history: BroadcastLogDTO[] = plain.map((log) => ({
    id: log._id,
    message: log.message,
    audience: log.audience,
    sentCount: log.sentCount,
    failedCount: log.failedCount,
    createdAt: log.createdAt,
  }));

  return <BroadcastView history={history} />;
}
