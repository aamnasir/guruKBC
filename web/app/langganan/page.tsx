"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { useAuth } from "@/lib/supabase/AuthContext";
import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { useUserRole } from "@/lib/hooks/useUserRole";
import styles from "./billing.module.css";

// Midtrans otomatis lagi diperbaiki -- sementara pembayaran manual transfer.
// Set false untuk kembali menampilkan tombol "Bayar dengan Midtrans".
const MANUAL_PAYMENT_MODE = true;

const BANK_ACCOUNT = { bank: "BCA", number: "3781741246", name: "Aam Abdul Nasir" };
const WHATSAPP_NUMBER = "6285930454719";

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

function whatsappLink(planLabel: string, price: string, email?: string) {
  const message = `Halo, saya sudah transfer ${price} untuk upgrade paket ${planLabel} GuruKBC.\nEmail akun: ${email ?? "-"}\nMohon diaktifkan. Terima kasih.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function BillingPage() {
  const { user } = useAuth();
  const gate = useSubscriptionGate();
  const { canManage } = useUserRole();
  const [paying, setPaying] = useState<"user" | "school" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!MANUAL_PAYMENT_MODE) loadSnapScript().catch(() => {});
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

      {MANUAL_PAYMENT_MODE && (
        <p className={styles.notice}>
          Pembayaran otomatis sedang dalam perbaikan. Sementara ini, transfer manual ke rekening di bawah lalu konfirmasi via WhatsApp — akun Anda akan diaktifkan begitu pembayaran kami terima.
        </p>
      )}

      <div className={styles.plans}>
        <section className="panel">
          <div className="panel-title"><div><h2>Guru</h2><p>Upgrade untuk akun Anda sendiri.</p></div></div>
          <p className={styles.price}>Rp 99.000<span>/tahun</span></p>
          <ul className={styles.benefits}>
            <li>Dokumen tak terbatas</li>
            <li>Tidak ada batas waktu uji coba</li>
            <li>Hanya berlaku untuk akun Anda</li>
          </ul>
          {gate.plan === "pro" ? (
            <button className="button button-primary" disabled>Sudah aktif</button>
          ) : MANUAL_PAYMENT_MODE ? (
            <div className={styles.manualBox}>
              <p><b>Transfer ke:</b> {BANK_ACCOUNT.bank} {BANK_ACCOUNT.number} a.n. {BANK_ACCOUNT.name}</p>
              <p><b>Nominal:</b> Rp 99.000</p>
              <a className="button button-primary" href={whatsappLink("Guru (Rp99.000/tahun)", "Rp99.000", user?.email)} target="_blank" rel="noreferrer">
                Konfirmasi via WhatsApp
              </a>
            </div>
          ) : (
            <button className="button button-primary" onClick={() => pay("user")} disabled={paying !== null}>
              {paying === "user" ? "Memproses..." : "Bayar dengan Midtrans"}
            </button>
          )}
        </section>

        <section className="panel">
          <div className="panel-title"><div><h2>Sekolah/Madrasah</h2><p>Upgrade untuk seluruh guru di sekolah Anda sekaligus.</p></div></div>
          <p className={styles.price}>Rp 2.000.000<span>/tahun</span></p>
          <ul className={styles.benefits}>
            <li>Semua guru di sekolah otomatis Pro</li>
            <li>Cocok dianggarkan dari dana BOS/yayasan</li>
            <li>Hanya Kepala Sekolah/Madrasah atau Admin yang bisa membeli</li>
          </ul>
          {!canManage ? (
            <p className={styles.hint}>Minta Kepala Sekolah/Madrasah atau Admin Anda yang melakukan pembelian ini.</p>
          ) : gate.schoolPlan === "pro" ? (
            <button className="button button-primary" disabled>Sudah aktif</button>
          ) : MANUAL_PAYMENT_MODE ? (
            <div className={styles.manualBox}>
              <p><b>Transfer ke:</b> {BANK_ACCOUNT.bank} {BANK_ACCOUNT.number} a.n. {BANK_ACCOUNT.name}</p>
              <p><b>Nominal:</b> Rp 2.000.000</p>
              <a className="button button-primary" href={whatsappLink("Sekolah/Madrasah (Rp2.000.000/tahun)", "Rp2.000.000", user?.email)} target="_blank" rel="noreferrer">
                Konfirmasi via WhatsApp
              </a>
            </div>
          ) : (
            <button className="button button-primary" onClick={() => pay("school")} disabled={paying !== null}>
              {paying === "school" ? "Memproses..." : "Bayar dengan Midtrans"}
            </button>
          )}
        </section>
      </div>
    </AppShell>
  );
}
