const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "pwm_auth_token";

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

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    throw new ApiError((data as { error?: string }).error ?? "Request failed", res.status, data);
  }

  return data as T;
}

function withBody(method: string) {
  return <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: withBody("POST"),
  patch: withBody("PATCH"),
  delete: withBody("DELETE"),
};
