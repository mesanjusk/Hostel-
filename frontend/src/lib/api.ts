import { emitUnauthorized } from "@/lib/auth-events";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "pwm_auth_token";
const REQUEST_TIMEOUT_MS = 15000;
const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_BASE_DELAY_MS = 400;

let authToken: string | null = localStorage.getItem(TOKEN_KEY);

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
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

function getWithDedupe<T>(path: string): Promise<T> {
  const existing = inFlightGets.get(path);
  if (existing) return existing as Promise<T>;

  const request = apiFetch<T>(path).finally(() => {
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
    });
}

export const api = {
  get: <T>(path: string) => getWithDedupe<T>(path),
  post: withBody("POST"),
  put: withBody("PUT"),
  patch: withBody("PATCH"),
  delete: withBody("DELETE"),
};
