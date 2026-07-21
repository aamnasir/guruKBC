"use client";

import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";

export function TrialBadge() {
  const gate = useSubscriptionGate();
  if (gate.loading || !gate.configured || gate.plan === "pro") return null;

  return (
    <small style={{ color: gate.blocked ? "#c0574f" : undefined }}>
      {gate.blocked
        ? "Uji coba berakhir"
        : `Uji coba: ${gate.daysLeft} hari · ${gate.documentsUsed}/${gate.documentsLimit} dokumen`}
    </small>
  );
}
