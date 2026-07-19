/** Meta's real customer-service window is 24h; treat it as closed 1h early so a slow send
 * (network latency, retry) never lands just past the actual cutoff and gets rejected. */
export const ADMIN_WINDOW_MS = 23 * 60 * 60 * 1000;

export function isAdminWindowOpen(waWindowOpenedAt: Date | null | undefined): boolean {
  return Boolean(waWindowOpenedAt) && Date.now() - waWindowOpenedAt!.getTime() < ADMIN_WINDOW_MS;
}
