import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { api, ApiError, setAuthToken, getAuthToken } from "@/lib/api";
import { subscribeUnauthorized } from "@/lib/auth-events";
import type { Gender, UserDTO } from "@/types";

interface OnboardingInput {
  name: string;
  gender: Gender;
  college: string;
  collegeCategoryId: string;
  courseId: string;
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
  requestRegisterOtp: (mobile: string) => Promise<OtpRequestResult>;
  registerWithOtp: (mobile: string, code: string, pin?: string) => Promise<void>;
  requestResetOtp: (mobile: string) => Promise<OtpRequestResult>;
  resetWithOtp: (mobile: string, code: string, pin?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      return;
    }
    try {
      const { user } = await api.get<{ user: UserDTO }>("/api/auth/me");
      setUser(user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAuthToken(null);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    // The API client emits this when a request comes back 401 for a token we did send —
    // i.e. the session died server-side (expired/rotated), not a bad login attempt.
    return subscribeUnauthorized(() => {
      setAuthToken(null);
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
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const completeOnboarding = useCallback(async (input: OnboardingInput) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>(
      "/api/auth/onboarding",
      input,
    );
    setAuthToken(token);
    setUser(user);
  }, []);

  const checkMobile = useCallback(async (mobile: string) => {
    const { exists } = await api.post<{ exists: boolean }>("/api/auth/check-mobile", { mobile });
    return exists;
  }, []);

  const requestRegisterOtp = useCallback(async (mobile: string) => {
    return api.post<OtpRequestResult>("/api/auth/register/request-otp", { mobile });
  }, []);

  const registerWithOtp = useCallback(async (mobile: string, code: string, pin?: string) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>(
      "/api/auth/register/verify",
      { mobile, code, pin },
    );
    setAuthToken(token);
    setUser(user);
  }, []);

  const requestResetOtp = useCallback(async (mobile: string) => {
    return api.post<OtpRequestResult>("/api/auth/forgot-password/request-otp", { mobile });
  }, []);

  const resetWithOtp = useCallback(async (mobile: string, code: string, pin?: string) => {
    const { token, user } = await api.post<{ token: string; user: UserDTO }>(
      "/api/auth/forgot-password/reset",
      { mobile, code, pin },
    );
    setAuthToken(token);
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        completeOnboarding,
        refreshUser,
        setUser,
        checkMobile,
        requestRegisterOtp,
        registerWithOtp,
        requestResetOtp,
        resetWithOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
