"use client";

import { useState, useEffect } from "react";
import { signIn, signUp } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import styles from "./auth.module.css";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/";
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        window.location.href = "/";
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        setError("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1>GuruKBC</h1>
          <p>Administrasi guru yang terhubung</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.authForm}>
          <h2>{mode === "signin" ? "Masuk" : "Daftar"}</h2>
          {error && <p className={styles.authError} role="alert">{error}</p>}
          {mode === "signup" && (
            <label>
              Nama Lengkap
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nama lengkap Anda" />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@contoh.com" />
          </label>
          <label>
            Kata Sandi
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="******" minLength={6} />
          </label>
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? "Memproses..." : mode === "signin" ? "Masuk" : "Daftar"}
          </button>
        </form>
        <p className={styles.authSwitch}>
          {mode === "signin" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
            {mode === "signin" ? "Daftar" : "Masuk"}
          </button>
        </p>
      </div>
    </div>
  );
}
