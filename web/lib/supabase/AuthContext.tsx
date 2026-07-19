"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./client";
import { signOut } from "./queries";
import type { Profile } from "./types";

type AuthContextType = {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(() => {
    void (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setUser(null);
          return;
        }
        const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser(data as Profile | null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    refreshProfile();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });
    return () => subscription.unsubscribe();
  }, [refreshProfile]);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    window.location.href = "/auth";
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan dalam AuthProvider");
  return context;
}
