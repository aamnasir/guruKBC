"use client";

import { useEffect, useState } from "react";
import { completeOnboarding, joinSchoolByCode } from "@/lib/supabase/queries";

export function OnboardingBanner() {
  const [state, setState] = useState<
    | { kind: "none" }
    | { kind: "created"; joinCode: string }
    | { kind: "invalid_code" }
    | { kind: "retrying" }
  >({ kind: "none" });
  const [retryCode, setRetryCode] = useState("");
  const [retryError, setRetryError] = useState("");

  useEffect(() => {
    (async () => {
      const result = await completeOnboarding();
      if (result.status === "created_school") setState({ kind: "created", joinCode: result.joinCode });
      else if (result.status === "invalid_code") setState({ kind: "invalid_code" });
    })();
  }, []);

  async function retryJoin() {
    if (!retryCode.trim()) return;
    setState({ kind: "retrying" });
    setRetryError("");
    const { data, error } = await joinSchoolByCode(retryCode.trim());
    if (error || !data) {
      setRetryError("Kode sekolah tidak ditemukan. Periksa kembali kode dari Kepala Sekolah/Madrasah/Admin Anda.");
      setState({ kind: "invalid_code" });
      return;
    }
    window.location.reload();
  }

  if (state.kind === "none") return null;

  const boxStyle: React.CSSProperties = {
    background: state.kind === "created" ? "#e8f7f4" : "#fff4f2",
    border: `1px solid ${state.kind === "created" ? "#bce5df" : "#f0c9c2"}`,
    borderRadius: 10,
    padding: "14px 18px",
    margin: "0 0 20px",
    display: "grid",
    gap: 8,
    fontSize: 13.5,
  };

  if (state.kind === "created") {
    return (
      <div style={boxStyle} role="status">
        <strong>Sekolah/Madrasah berhasil dibuat 🎉</strong>
        <span>
          Kode Sekolah Anda: <b style={{ letterSpacing: 2, fontSize: 16 }}>{state.joinCode}</b> — bagikan kode ini ke guru-guru
          Anda supaya mereka bisa bergabung saat mendaftar. Kode ini juga selalu bisa dilihat di Master Data &raquo; Profil
          Sekolah/Madrasah.
        </span>
      </div>
    );
  }

  return (
    <div style={boxStyle} role="alert">
      <strong style={{ color: "#a6392f" }}>Kode sekolah belum ditemukan</strong>
      <span>Kode yang Anda masukkan saat mendaftar tidak cocok dengan sekolah mana pun. Coba masukkan lagi:</span>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={retryCode}
          onChange={(event) => setRetryCode(event.target.value.toUpperCase())}
          placeholder="Kode sekolah"
          maxLength={6}
          style={{ border: "1px solid #d5dde3", borderRadius: 7, padding: "9px 11px", font: "inherit", fontSize: 13 }}
        />
        <button type="button" className="button button-primary" onClick={retryJoin} disabled={state.kind === "retrying"}>
          {state.kind === "retrying" ? "Memeriksa..." : "Coba lagi"}
        </button>
      </div>
      {retryError && <span style={{ color: "#a6392f" }}>{retryError}</span>}
    </div>
  );
}
