"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AuthModal } from "@/components/auth/AuthModal";

export type AuthUser = {
  id: number;
  username: string;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type CredentialsResponse = {
  user?: unknown;
  error?: unknown;
};

function pickUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as { id?: unknown; username?: unknown };
  if (typeof record.id !== "number" || typeof record.username !== "string") {
    return null;
  }

  return { id: record.id, username: record.username };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isAuthOpen, setAuthOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`读取登录状态失败: ${response.status}`);
      }

      const data = (await response.json()) as { user?: unknown };
      const next = pickUser(data.user);
      setUser(next);
      setStatus(next ? "authenticated" : "unauthenticated");
    } catch (error) {
      console.error("读取登录状态失败:", error);
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitCredentials = useCallback(
    async (endpoint: string, username: string, password: string) => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json().catch(() => ({}))) as CredentialsResponse;

      if (!response.ok) {
        const message =
          typeof data.error === "string" ? data.error : "操作失败，请稍后再试";
        throw new Error(message);
      }

      const next = pickUser(data.user);
      setUser(next);
      setStatus(next ? "authenticated" : "unauthenticated");
    },
    []
  );

  const login = useCallback(
    (username: string, password: string) =>
      submitCredentials("/api/auth/login", username, password),
    [submitCredentials]
  );

  const register = useCallback(
    (username: string, password: string) =>
      submitCredentials("/api/auth/register", username, password),
    [submitCredentials]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("退出登录失败:", error);
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const openAuthModal = useCallback(() => setAuthOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthOpen(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthOpen,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      logout,
      refresh,
    }),
    [
      user,
      status,
      isAuthOpen,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      logout,
      refresh,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal open={isAuthOpen} onClose={closeAuthModal} />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth 必须在 AuthProvider 内部使用");
  }

  return context;
}
