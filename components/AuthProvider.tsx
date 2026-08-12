"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase/client";

type AuthContextType = {
  authenticated: boolean;
  admin: boolean;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  admin: false,
  loading: true,
});

type AuthStatus = {
  authenticated: boolean;
  admin: boolean;
};

async function loadAuthStatus(): Promise<AuthStatus> {
  const response = await fetch("/auth/dev-session", { cache: "no-store" });
  if (!response.ok) throw new Error("Auth status request failed");
  return response.json() as Promise<AuthStatus>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadAuthStatus()
      .then((status) => {
        if (!active) return;
        setAuthenticated(status.authenticated);
        setAdmin(status.admin);
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        setAdmin(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadAuthStatus().then((status) => {
        setAuthenticated(status.authenticated);
        setAdmin(status.admin);
        setLoading(false);
      }).catch(() => {
        setAuthenticated(false);
        setAdmin(false);
        setLoading(false);
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, admin, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
