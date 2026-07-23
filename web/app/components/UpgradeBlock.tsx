"use client";

import type { SubscriptionGate } from "@/lib/hooks/useSubscriptionGate";

export function UpgradeBlock({ gate }: { gate: SubscriptionGate }) {
  if (!gate.blocked) return null;

  const message =
    gate.reason === "trial_expired"
      ? "Masa uji coba 7 hari Anda sudah berakhir."
      : `Anda sudah membuat ${gate.documentsUsed} dari ${gate.documentsLimit} dokumen di paket uji coba.`;

  return (
    <div
      role="alert"
      style={{
        background: "#fff4f2",
        border: "1px solid #f0c9c2",
        borderRadius: 10,
        padding: "16px 18px",
        display: "grid",
        gap: 6,
        margin: "16px 0",
      }}
    >
      <strong style={{ color: "#a6392f" }}>Dokumen tidak bisa disimpan lagi</strong>
      <span style={{ fontSize: 13.5, color: "#5a4a48" }}>
        {message} Upgrade ke paket berbayar untuk membuat dokumen tanpa batas.
      </span>
      <a
        href="/langganan"
        className="button button-primary"
        style={{ justifySelf: "start", marginTop: 4 }}
      >
        Lihat paket upgrade
      </a>
    </div>
  );
}
