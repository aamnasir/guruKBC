import { useCallback, useEffect, useState } from "react";
import { getUserSchoolId, getSubscription, incrementDocumentCount } from "@/lib/supabase/queries";

const TRIAL_DAYS = 7;
const DOCUMENT_LIMIT = 5;

export type SubscriptionGate = {
  loading: boolean;
  configured: boolean;
  plan: "free" | "pro";
  documentsUsed: number;
  documentsLimit: number;
  daysLeft: number;
  blocked: boolean;
  reason: "trial_expired" | "quota_exceeded" | null;
  recordDocumentSave: () => Promise<boolean>;
};

export function useSubscriptionGate(): SubscriptionGate {
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [documentsUsed, setDocumentsUsed] = useState(0);

  useEffect(() => {
    (async () => {
      const id = await getUserSchoolId();
      setSchoolId(id);
      if (id) {
        const { data } = await getSubscription(id);
        if (data) {
          setPlan(data.plan);
          setTrialStartedAt(data.trial_started_at);
          setDocumentsUsed(data.documents_created);
        }
      }
      setLoading(false);
    })();
  }, []);

  const daysElapsed = trialStartedAt ? Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / 86400000) : 0;
  const daysLeft = trialStartedAt ? Math.max(0, TRIAL_DAYS - daysElapsed) : TRIAL_DAYS;
  const trialExpired = plan === "free" && trialStartedAt !== null && daysElapsed >= TRIAL_DAYS;
  const quotaExceeded = plan === "free" && documentsUsed >= DOCUMENT_LIMIT;
  const blocked = plan === "free" && (trialExpired || quotaExceeded);
  const reason: "trial_expired" | "quota_exceeded" | null = !blocked ? null : trialExpired ? "trial_expired" : "quota_exceeded";

  const recordDocumentSave = useCallback(async (): Promise<boolean> => {
    if (!schoolId) return true; // Supabase belum dikonfigurasi -- jangan blokir pemakaian lokal
    if (plan === "pro") return true;
    if (blocked) return false;
    const { data } = await incrementDocumentCount(schoolId);
    if (data) {
      setPlan(data.plan);
      setTrialStartedAt(data.trial_started_at);
      setDocumentsUsed(data.documents_created);
    }
    return true;
  }, [schoolId, plan, blocked]);

  return {
    loading,
    configured: schoolId !== null,
    plan,
    documentsUsed,
    documentsLimit: DOCUMENT_LIMIT,
    daysLeft,
    blocked,
    reason,
    recordDocumentSave,
  };
}
