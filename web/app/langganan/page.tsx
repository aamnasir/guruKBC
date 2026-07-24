"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { useUserRole } from "@/lib/hooks/useUserRole";
import styles from "./billing.module.css";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) { resolve(); return; }
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    if (!clientKey) { reject(new Error("NEXT_PUBLIC_MIDTRANS_CLIENT_KEY belum diatur")); return; }
    const script = document.createElement("script");
    script.src = isProduction ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat skrip pembayaran"));
    document.body.appendChild(script);
  });
}

export default function BillingPage() {
  const gate = useSubscriptionGate();
  const { canManage } = useUserRole();
  const [paying, setPaying] = useState<"user" | "school" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadSnapScript().catch(() => {});
  }, []);

  async function pay(targetType: "user" | "school") {
    setPaying(targetType);
    setError("");
    setStatus("");
    try {
      await loadSnapScript();
      const response = await fetch("/api/midtrans/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error ?? "Gagal membuat transaksi."); setPaying(null); return; }

      window.snap?.pay(data.token, {
        onSuccess: () => { setStatus("Pembayaran berhasil! Status langganan akan aktif dalam beberapa saat — muat ulang halaman ini."); setPaying(null); },
        onPending: () => { setStatus("Pembayaran Anda sedang diproses. Status akan diperbarui otomatis setelah selesai."); setPaying(null); },
        onError: () => { setError("Pembayaran gagal. Silakan coba lagi."); setPaying(null); },
        onClose: () => { setPaying(null); },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setPaying(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="LANGGANAN"
        title="Upgrade Paket GuruKBC"
        description="Pilih upgrade untuk akun Anda sendiri, atau untuk seluruh sekolah/madrasah sekaligus."
      />

      <section className={styles.statusBar}>
        <div><span>Status Anda</span><strong>{gate.plan === "pro" ? "Pro" : `Uji coba — ${gate.daysLeft} hari, ${gate.documentsUsed}/${gate.documentsLimit} dokumen`}</strong></div>
        <div><span>Status Sekolah/Madrasah</span><strong>{gate.schoolPlan === "pro" ? "Pro (semua anggota)" : "Belum berlangganan"}</strong></div>
      </section>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {status && <p className={styles.notice}>{status}</p>}

      <div className={styles.plans}>
        <section className="panel">
          <div className="panel-title"><div><h2>Guru</h2><p>Upgrade untuk akun Anda sendiri.</p></div></div>
          <p className={styles.price}>Rp 99.000<span>/tahun</span></p>
          <ul className={styles.benefits}>
            <li>Dokumen tak terbatas</li>
            <li>Tidak ada batas waktu uji coba</li>
            <li>Hanya berlaku untuk akun Anda</li>
          </ul>
          <button className="button button-primary" onClick={() => pay("user")} disabled={paying !== null || gate.plan === "pro"}>
            {gate.plan === "pro" ? "Sudah aktif" : paying === "user" ? "Memproses..." : "Bayar dengan Midtrans"}
          </button>
        </section>

        <section className="panel">
          <div className="panel-title"><div><h2>Sekolah/Madrasah</h2><p>Upgrade untuk seluruh guru di sekolah Anda sekaligus.</p></div></div>
          <p className={styles.price}>Rp 2.000.000<span>/tahun</span></p>
          <ul className={styles.benefits}>
            <li>Semua guru di sekolah otomatis Pro</li>
            <li>Cocok dianggarkan dari dana BOS/yayasan</li>
            <li>Hanya Kepala Sekolah/Madrasah atau Admin yang bisa membeli</li>
          </ul>
          {canManage ? (
            <button className="button button-primary" onClick={() => pay("school")} disabled={paying !== null || gate.schoolPlan === "pro"}>
              {gate.schoolPlan === "pro" ? "Sudah aktif" : paying === "school" ? "Memproses..." : "Bayar dengan Midtrans"}
            </button>
          ) : (
            <p className={styles.hint}>Minta Kepala Sekolah/Madrasah atau Admin Anda yang melakukan pembelian ini.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}
