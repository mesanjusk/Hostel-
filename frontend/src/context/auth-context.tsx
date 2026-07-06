import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { api, ApiError, setAuthToken, getAuthToken } from "@/lib/api";
import type { UserDTO } from "@/types";

interface OnboardingInput {
  name: string;
  college?: string;
  hostel?: string;
  roomNumber?: string;
}

interface AuthContextValue {
  user: UserDTO | null;
  loading: boolean;
  login: (mobile: string, pin: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: (input: OnboardingInput) => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: UserDTO) => void;
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

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, completeOnboarding, refreshUser, setUser }}
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
