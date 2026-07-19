"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  const refreshProfileRef = useRef<() => void>(() => {});

  const doRefreshProfile = () => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => {
        setUser(data as Profile);
      });
    });
  };

  refreshProfileRef.current = () => {
    refreshProfile();
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    doRefreshProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      doRefreshProfile();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const refreshProfile = () => {
    if (refreshProfileRef.current) refreshProfileRef.current();
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    window.location.href = "/auth";
  };

  useEffect(() => {
    if (!loading) return;
    if (user !== null) setLoading(false);
  }, [loading, user]);

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
