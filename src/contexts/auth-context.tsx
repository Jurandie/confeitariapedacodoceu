'use client';

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type OwnerProfile = {
  name: string;
  phone: string;
};

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  owner: OwnerProfile | null;
  pending: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function parseJson<T = Record<string, unknown>>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return {} as T;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (!res.ok) throw new Error("Falha ao carregar sessao");
      const data = await parseJson<{ authenticated?: boolean; owner?: OwnerProfile | null }>(res);
      setStatus(data.authenticated ? "authenticated" : "anonymous");
      setOwner(data.owner ?? null);
    } catch {
      setStatus("anonymous");
      setOwner(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (phone: string, password: string) => {
      setPending(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ login: phone, password }),
        });

        const data = await parseJson<{ owner?: OwnerProfile | null; message?: string }>(res);

        if (!res.ok) {
          return { success: false, message: data?.message ?? "Nao foi possivel fazer login." };
        }

        setStatus("authenticated");
        setOwner(data.owner ?? null);
        return { success: true };
      } catch {
        return { success: false, message: "Erro de conexao. Tente novamente." };
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setStatus("anonymous");
      setOwner(null);
      setPending(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      owner,
      pending,
      login,
      logout,
      refresh,
    }),
    [status, owner, pending, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider");
  }
  return context;
}
