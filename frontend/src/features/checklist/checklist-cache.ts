import type { ChecklistItemRaw } from "@/features/checklist/checklist-item-dto";

/** The raw `/api/checklist` payload shape, persisted verbatim so a returning user's checklist
 * paints instantly on the next load while the network revalidates in the background. */
export interface PersistedChecklistPayload {
  categories: { category: string; items: ChecklistItemRaw[] }[];
}

interface StoredEntry extends PersistedChecklistPayload {
  /** Scopes the cache to the user it was fetched for — on a shared hostel-room device, a
   * different student's reload must never paint the previous student's checklist (mirrors the
   * per-user clearing lib/api.ts already does for its in-memory GET cache). */
  userId: string;
}

const STORAGE_KEY = "pwm_checklist_cache";

/** Last-known checklist for `userId`, or null if there's none (or it belongs to another user).
 * Any storage/parse failure is swallowed — this is a progressive-enhancement fast path, never a
 * source of truth, so a miss just falls back to the normal fetch. */
export function readPersistedChecklist(userId: string | undefined): PersistedChecklistPayload | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredEntry;
    if (parsed.userId !== userId || !Array.isArray(parsed.categories)) return null;
    return { categories: parsed.categories };
  } catch {
    return null;
  }
}

export function writePersistedChecklist(userId: string | undefined, payload: PersistedChecklistPayload) {
  if (!userId) return;
  try {
    const entry: StoredEntry = { userId, categories: payload.categories };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage full/disabled (private mode, quota) — non-fatal, we just lose the instant
    // first paint on the next load and fall back to the skeleton + fetch.
  }
}

export function clearPersistedChecklist() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore — nothing we can do, and it isn't worth surfacing.
  }
}
