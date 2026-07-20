"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { resetPassword, signIn, signUp } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import styles from "./auth.module.css";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const isConfigured = Boolean(supabase);

 useEffect(() => {
  if (!supabase) return;

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) window.location.href = "/";
  };

  checkSession();
}, []);


  const handleSubmit = async (event: React.FormEvent) => {
    console.log("handleSubmit called, mode:", mode, "email:", email);
    event.preventDefault();
    if (!isConfigured) {
      setError("Layanan autentikasi belum dikonfigurasi. Lengkapi pengaturan Supabase terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        window.location.href = "/";
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        setNotice("Pendaftaran berhasil. Periksa email Anda untuk memverifikasi akun sebelum masuk.");
        setMode("signin");
      }
    } catch (err) {
      console.error("Sign up/in error:", err);
      let message = "Terjadi kesalahan";
      if (err instanceof Error) {
  message = err.message;
  
  // Menggunakan type assertion (err as any) agar TypeScript mengizinkan akses ke properti kustom
  const errorObj = err as any;
  if (errorObj.status) message += ` (Status: ${errorObj.status})`;
  if (errorObj.error) message += ` - ${errorObj.error}`;
  
  if (err.message && err.message.includes("email")) {
    message = "Gagal mendaftar. Pastikan email valid dan belum terdaftar.";
  }
}

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!isConfigured) {
      setError("Layanan autentikasi belum dikonfigurasi.");
      return;
    }
    if (!email) {
      setError("Masukkan alamat email terlebih dahulu untuk mereset kata sandi.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setNotice("Tautan reset kata sandi telah dikirim ke email Anda.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tautan reset kata sandi tidak dapat dikirim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <section className={styles.authShell}>
        <aside className={styles.intro}>
          <div className={styles.brand}><Image src="/gurukbc-logo.svg" alt="Logo GuruKBC" width={34} height={34} priority />GuruKBC</div>
          <div className={styles.introContent}>
            <p className={styles.eyebrow}>ADMINISTRASI GURU</p>
            <h1>Perangkat ajar yang saling terhubung.</h1>
            <p>Kelola perencanaan, asesmen, dan arsip dokumen Kurikulum Berbasis Cinta dalam satu tempat.</p>
          </div>
          <ul className={styles.featureList}>
            <li><span>✓</span> Data diisi sekali, dipakai di semua dokumen</li>
            <li><span>✓</span> Preview serta ekspor DOCX dan PDF</li>
            <li><span>✓</span> Arsip versi perangkat pembelajaran</li>
          </ul>
        </aside>
        <main className={styles.authCard}>
          <div className={styles.authHeader}>
            <p className={styles.formEyebrow}>{mode === "signin" ? "SELAMAT DATANG" : "BUAT AKUN"}</p>
            <h2>{mode === "signin" ? "Masuk ke akun Anda" : "Mulai gunakan GuruKBC"}</h2>
            <p>{mode === "signin" ? "Masukkan detail akun untuk melanjutkan." : "Isi data berikut untuk membuat akun guru."}</p>
          </div>
          <form onSubmit={handleSubmit} className={styles.authForm}>
            {error && <p className={styles.authError} role="alert">{error}</p>}
            {notice && <p className={styles.authNotice} role="status">{notice}</p>}
            {mode === "signup" && (
              <label>
                Nama Lengkap
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nama lengkap Anda" autoComplete="name" />
              </label>
            )}
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@email.com" autoComplete="email" />
            </label>
            <label>
              Kata Sandi
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Minimal 6 karakter" minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </label>
            <button type="submit" className={styles.submitButton} disabled={loading || !isConfigured}>
              {loading ? "Memproses..." : mode === "signin" ? "Masuk" : "Buat akun"}<span aria-hidden="true">&rarr;</span>
            </button>
            {mode === "signin" && <button type="button" className={styles.resetButton} onClick={() => void handlePasswordReset()} disabled={loading}>Lupa kata sandi?</button>}
          </form>
          <p className={styles.authSwitch}>
            {mode === "signin" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setNotice(""); }}>
              {mode === "signin" ? "Daftar sekarang" : "Masuk"}
            </button>
          </p>
        </main>
      </section>
    </div>
  );
}
