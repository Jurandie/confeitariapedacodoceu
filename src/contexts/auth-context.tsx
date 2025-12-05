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
  email: string;
};

type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  owner: OwnerProfile | null;
  pending: boolean;
  requestCode: (email: string) => Promise<{ success: boolean; message?: string }>;
  login: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
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
      const data = await res.json();
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

  const requestCode = useCallback(async (email: string) => {
    setPending(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await parseJson(res);
      if (!res.ok) {
        return { success: false, message: data?.message ?? "Nao foi possivel enviar o codigo." };
      }
      return { success: true, message: data?.message };
    } catch {
      return { success: false, message: "Erro ao enviar codigo. Tente novamente." };
    } finally {
      setPending(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, code: string) => {
      setPending(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });

        const data = await parseJson(res);

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
      requestCode,
      logout,
      refresh,
    }),
    [status, owner, pending, requestCode, login, logout, refresh],
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
