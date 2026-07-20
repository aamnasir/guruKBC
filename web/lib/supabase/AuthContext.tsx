"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './client';
import { User, Session } from '@supabase/supabase-js';

// 1. Tambahkan properti signOut ke dalam tipe data Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>; // <--- Daftarkan tipe data di sini
}

// 2. Berikan nilai default fungsi kosong untuk signOut
const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  signOut: async () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 3. Buat fungsi implementasi signOut asli menggunakan Supabase client
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
      window.location.href = "/auth"; // Lempar ke halaman auth setelah logout
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
  const session: Session | null = data.session;
  setUser(session?.user ?? null);
  setLoading(false);
});

   const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
  setUser(session?.user ?? null);
  setLoading(false);
});

    return () => subscription.unsubscribe();
  }, []);

  return (
    // 4. Masukkan fungsi signOut ke dalam value Provider
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);