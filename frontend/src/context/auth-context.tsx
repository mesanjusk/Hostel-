import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { api, ApiError, setAuthToken, getAuthToken } from "@/lib/api";
import { subscribeUnauthorized } from "@/lib/auth-events";
import { readPersistedUser, writePersistedUser, clearPersistedUser } from "@/lib/user-cache";
import { clearPersistedChecklist } from "@/features/checklist/checklist-cache";
import { clearPersistedMyCommunities } from "@/features/community/community-cache";
import type { Gender, UserDTO } from "@/types";

// Dynamic: lib/socket pulls in socket.io-client, which only ever connects from lazy-loaded
// chat/community routes. A static import here would ship that whole transport stack in the
// main bundle for every visitor, including anonymous users who only see the login screen.
const disconnectSocket = () => import("@/lib/socket").then((m) => m.disconnectSocket());

interface OnboardingInput {
  name: string;
  gender: Gender;
  /** Optional — a student can finish onboarding without picking a profile picture. */
  avatar?: string;
}

interface OtpRequestResult {
  sent: boolean;
  error?: string | null;
  devOtp?: string;
}

interface AuthContextValue {
  user: UserDTO | null;
  loading: boolean;
  login: (mobile: string, pin: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserDTO) => void;
  checkMobile: (mobile: string) => Promise<boolean>;
  loginWithToken: (token: string, user: UserDTO) => void;
  /** Passwordless MSG91 login: exchange a widget-verified access-token for a session. First
   * time for a number registers it (user comes back with needsOnboarding=true). */
  loginWithWidget: (accessToken: string) => Promise<void>;
  requestRegisterOtp: (mobile: string) => Promise<OtpRequestResult>;
  registerWithOtp: (mobile: string, code: string, pin?: string) => Promise<void>;
  requestResetOtp: (mobile: string) => Promise<OtpRequestResult>;
  resetWithOtp: (mobile: string, code: string, pin?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Boot from the persisted session when we have both a token and a cached user: the app
  // shell renders immediately and /api/auth/me revalidates in the background, instead of
  // every load blanking on that round-trip (see lib/user-cache.ts). `loading` is only true
  // on a genuinely unknown session — token present but nothing cached yet.
  const [user, setUser] = useState<UserDTO | null>(() => (getAuthToken() ? readPersistedUser() : null));
  const [loading, setLoading] = useState(() => getAuthToken() !== null && readPersistedUser() === null);

  /** Single write path for the session user — keeps the persisted copy in lockstep with
   * state so a stale profile can never outlive the session that wrote it. */
  const applyUser = useCallback((next: UserDTO | null) => {
    if (next) {
      writePersistedUser(next);
    } else {
      clearPersistedUser();
    }
    setUser(next);
  }, []);

  // Every visitor gets a real (if unidentified) account the moment the app boots with no
  // session at all — a brand-new browser, or one that cleared storage. This is what lets
  // checklist/budget/notes/etc. start saving to the server before anyone has registered: the
  // JWT this issues is a completely ordinary session, it's just for an account with no mobile
  // number yet (see backend POST /api/auth/anonymous). Failing silently and leaving `user: null`
  // is the only fallback — an offline first-ever visit just gets the login-gated experience.
  const ensureAnonymousSession = useCallback(async () => {
    try {
      const { token, user } = await api.post<{ token: string; user: UserDTO }>("/api/auth/anonymous");
      setAuthToken(token);
      applyUser(user);
    } catch {
      applyUser(null);
    }
  }, [applyUser]);

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) {
      await ensureAnonymousSession();
      return;
    }
    try {
      const { user } = await api.get<{ user: UserDTO }>("/api/auth/me");
      applyUser(user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthToken(null);
        applyUser(null);
        return;
      }
      // Transient failure (offline, 5xx, cold backend): keep rendering the persisted
      // session rather than bouncing a logged-in user to the login page — any real
      // session death surfaces as a 401 on the next request and is handled above.
      setUser((prev) => {
        if (!prev) clearPersistedUser();
        return prev;
      });
    }
  }, [applyUser, ensureAnonymousSession]);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    // The API client emits this when a request comes back 401 for a token we did send —
    // i.e. the session died server-side (expired/rotated), not a bad login attempt.
    return subscribeUnauthorized(() => {
      setAuthToken(null);
      clearPersistedUser();
      disconnectSocket();
      setUser((prev) => {
        if (prev) {
          toast.error("Your session has expired. Please log in again.");
        }
        return null;
      });
    });
  }, []);

  const login = useCallback(async (mobile: string, pin: string) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>("/api/auth/login", {
      mobile,
      pin,
    });
    setAuthToken(token);
    applyUser(user);
  }, [applyUser]);

  const logout = useCallback(() => {
    setAuthToken(null);
    applyUser(null);
    // Drop the persisted checklist so the next student on a shared device doesn't briefly see
    // this one's list on their first load (the payload is user-scoped, but on explicit logout
    // there's no reason to keep it lying around).
    clearPersistedChecklist();
    clearPersistedMyCommunities();
    disconnectSocket();
  }, [applyUser]);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>(
      "/api/auth/onboarding",
      input,
    );
    setAuthToken(token);
    applyUser(user);
  }, [applyUser]);

  const checkMobile = useCallback(async (mobile: string) => {
    const { exists } = await api.post<{ exists: boolean }>("/api/auth/check-mobile", { mobile });
    return exists;
  }, []);

  // Used by the /wa-login flow once the backend confirms the WhatsApp registration message
  // arrived — the token/user are already issued server-side, this just adopts the session.
  const loginWithToken = useCallback(
    (token: string, user: UserDTO) => {
      setAuthToken(token);
      applyUser(user);
    },
    [applyUser],
  );

  const loginWithWidget = useCallback(async (accessToken: string) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>(
      "/api/auth/otp/widget-verify",
      { accessToken },
    );
    setAuthToken(token);
    applyUser(user);
  }, [applyUser]);

  const requestRegisterOtp = useCallback(async (mobile: string) => {
    return api.post<OtpRequestResult>("/api/auth/register/request-otp", { mobile });
  }, []);

  const registerWithOtp = useCallback(async (mobile: string, code: string, pin?: string) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>(
      "/api/auth/register/verify",
      { mobile, code, pin },
    );
    setAuthToken(token);
    applyUser(user);
  }, [applyUser]);

  const requestResetOtp = useCallback(async (mobile: string) => {
    return api.post<OtpRequestResult>("/api/auth/forgot-password/request-otp", { mobile });
  }, []);

  const resetWithOtp = useCallback(async (mobile: string, code: string, pin?: string) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>(
      "/api/auth/forgot-password/reset",
      { mobile, code, pin },
    );
    setAuthToken(token);
    applyUser(user);
  }, [applyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      completeOnboarding,
      refreshUser,
      // Exposed as `setUser` so profile edits etc. keep the persisted copy current too.
      setUser: applyUser,
      checkMobile,
      loginWithToken,
      loginWithWidget,
      requestRegisterOtp,
      registerWithOtp,
      requestResetOtp,
      resetWithOtp,
    }),
    [
      user,
      loading,
      login,
      logout,
      completeOnboarding,
      refreshUser,
      applyUser,
      checkMobile,
      loginWithToken,
      loginWithWidget,
      requestRegisterOtp,
      registerWithOtp,
      requestResetOtp,
      resetWithOtp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
