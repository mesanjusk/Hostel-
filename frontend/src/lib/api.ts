import { emitUnauthorized } from "@/lib/auth-events";
import { getVisitorAndSessionIds } from "@/lib/analytics/client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "pwm_auth_token";
const REQUEST_TIMEOUT_MS = 15000;
const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_BASE_DELAY_MS = 400;
// Short-lived cache for GET responses, keyed by path. Every mutation (POST/PUT/PATCH/DELETE)
// clears it — same "everything might be stale, refetch" philosophy as lib/refresh-bus.ts —
// so switching tabs and back within this window is instant instead of a blank-screen refetch.
const GET_CACHE_TTL_MS = 30000;
const getCache = new Map<string, { data: unknown; expiresAt: number }>();

let authToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  // Every cached GET is scoped to whichever user was logged in when it was fetched — on a
  // shared hostel-room device, switching accounts without this would leak the previous
  // student's dashboard/checklist/budget data into the next login for up to GET_CACHE_TTL_MS.
  getCache.clear();
}

export function getAuthToken() {
  return authToken;
}

export class ApiError extends Error {
  status: number;
  /** Full parsed JSON response body, when available — lets callers read extra fields
   * beyond `message` (e.g. a 409's `{ moveRequired, itemCount }`). */
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Fallback copy for responses that don't carry their own `error` string (network failures,
// non-JSON error pages from a proxy/CDN, etc). Anything the backend already describes wins.
const STATUS_MESSAGES: Record<number, string> = {
  400: "That request wasn't valid. Please check the form and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: "That conflicts with existing data.",
  422: "Some of the information provided isn't valid.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again.",
  502: "The server is temporarily unavailable. Please try again shortly.",
  503: "The server is temporarily unavailable. Please try again shortly.",
  504: "The request timed out. Please try again.",
};

function friendlyMessage(status: number, serverMessage?: string) {
  return serverMessage || STATUS_MESSAGES[status] || "Something went wrong. Please try again.";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch<T>(path: string, options: RequestInit = {}, attempt = 0): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const isSafeRetryable = method === "GET";

  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const hadToken = Boolean(authToken);
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  // Lets server-emitted analytics events (login, registration, OTP outcomes) join the same
  // visitor/session timeline as the client-tracked page views — see lib/analytics/client.ts.
  const { visitorId, sessionId } = getVisitorAndSessionIds();
  headers.set("X-Visitor-Id", visitorId);
  headers.set("X-Session-Id", sessionId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    // Every response here is dynamic/personalized/admin-configurable — never let the
    // browser (or an intermediary) serve a stale cached copy after something changes.
    res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    if (isSafeRetryable && attempt < GET_RETRY_ATTEMPTS) {
      await sleep(GET_RETRY_BASE_DELAY_MS * 2 ** attempt);
      return apiFetch<T>(path, options, attempt + 1);
    }
    throw new ApiError(
      timedOut
        ? "Request timed out. Please check your connection and try again."
        : "Unable to reach the server. Please check your internet connection.",
      0,
    );
  }
  clearTimeout(timeoutId);

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    // A flaky 5xx on a read is worth one silent retry before bothering the user.
    if (res.status >= 500 && isSafeRetryable && attempt < GET_RETRY_ATTEMPTS) {
      await sleep(GET_RETRY_BASE_DELAY_MS * 2 ** attempt);
      return apiFetch<T>(path, options, attempt + 1);
    }
    if (res.status === 401 && hadToken) {
      emitUnauthorized();
    }
    throw new ApiError(friendlyMessage(res.status, (data as { error?: string }).error), res.status, data);
  }

  return data as T;
}

// Dedupe identical concurrent GETs (e.g. two widgets mounting at once and both asking for the
// same list) so we don't fire the request twice — the second caller just rides the first.
const inFlightGets = new Map<string, Promise<unknown>>();

/** Synchronously reads a still-fresh cached GET response, if any — lets a component seed its
 * initial state with the last known data instead of `null` when it (re)mounts (e.g. switching
 * back to a tab), avoiding a blank flash while the background refetch is in flight. */
export function peekCache<T>(path: string): T | undefined {
  const cached = getCache.get(path);
  return cached && cached.expiresAt > Date.now() ? (cached.data as T) : undefined;
}

function getWithDedupe<T>(path: string): Promise<T> {
  const cached = getCache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data as T);
  }

  const existing = inFlightGets.get(path);
  if (existing) return existing as Promise<T>;

  const request = apiFetch<T>(path)
    .then((data) => {
      getCache.set(path, { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
      return data;
    })
    .finally(() => {
      inFlightGets.delete(path);
    });
  inFlightGets.set(path, request);
  return request as Promise<T>;
}

function withBody(method: string) {
  return <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((data) => {
      // Any mutation can affect data another page has cached (e.g. adding a checklist item
      // changes /api/dashboard's counts too) — simplest correct move is to drop it all.
      getCache.clear();
      return data;
    });
}

export const api = {
  get: <T>(path: string) => getWithDedupe<T>(path),
  post: withBody("POST"),
  put: withBody("PUT"),
  patch: withBody("PATCH"),
  delete: withBody("DELETE"),
};
