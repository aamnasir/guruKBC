import { useCallback, useEffect, useState } from "react";
import { getUser, getUserSchoolId, getSubscription, getSchoolSubscription, incrementDocumentCount } from "@/lib/supabase/queries";

const TRIAL_DAYS = 7;
const DOCUMENT_LIMIT = 5;

export type SubscriptionGate = {
  loading: boolean;
  configured: boolean;
  plan: "free" | "pro";
  schoolPlan: "free" | "pro";
  documentsUsed: number;
  documentsLimit: number;
  daysLeft: number;
  blocked: boolean;
  reason: "trial_expired" | "quota_exceeded" | null;
  recordDocumentSave: () => Promise<boolean>;
};

// Batas uji coba berlaku PER AKUN GURU. Tapi kalau SEKOLAHNYA sudah
// berlangganan paket premium (school_subscriptions.plan = 'pro'),
// guru itu otomatis ikut premium juga -- tanpa perlu bayar sendiri.
export function useSubscriptionGate(): SubscriptionGate {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [personalPlan, setPersonalPlan] = useState<"free" | "pro">("free");
  const [schoolPlan, setSchoolPlan] = useState<"free" | "pro">("free");
  const [trialStartedAt, setTrialStartedAt] = useState<string | null>(null);
  const [documentsUsed, setDocumentsUsed] = useState(0);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      setSignedIn(!!user);
      if (user) {
        const { data } = await getSubscription();
        if (data) {
          setPersonalPlan(data.plan);
          setTrialStartedAt(data.trial_started_at);
          setDocumentsUsed(data.documents_created);
        }
        const schoolId = await getUserSchoolId();
        if (schoolId) {
          const { data: schoolSub } = await getSchoolSubscription(schoolId);
          if (schoolSub) setSchoolPlan(schoolSub.plan);
        }
      }
      setLoading(false);
    })();
  }, []);

  const plan: "free" | "pro" = personalPlan === "pro" || schoolPlan === "pro" ? "pro" : "free";

  const daysElapsed = trialStartedAt ? Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / 86400000) : 0;
  const daysLeft = trialStartedAt ? Math.max(0, TRIAL_DAYS - daysElapsed) : TRIAL_DAYS;
  const trialExpired = plan === "free" && trialStartedAt !== null && daysElapsed >= TRIAL_DAYS;
  const quotaExceeded = plan === "free" && documentsUsed >= DOCUMENT_LIMIT;
  const blocked = plan === "free" && (trialExpired || quotaExceeded);
  const reason: "trial_expired" | "quota_exceeded" | null = !blocked ? null : trialExpired ? "trial_expired" : "quota_exceeded";

  const recordDocumentSave = useCallback(async (): Promise<boolean> => {
    if (!signedIn) return true; // Supabase belum dikonfigurasi -- jangan blokir pemakaian lokal
    if (plan === "pro") return true; // pro pribadi ATAU pro sekolah -- tidak perlu hitung dokumen lagi
    if (blocked) return false;
    const { data } = await incrementDocumentCount();
    if (data) {
      setPersonalPlan(data.plan);
      setTrialStartedAt(data.trial_started_at);
      setDocumentsUsed(data.documents_created);
    }
    return true;
  }, [signedIn, plan, blocked]);

  return {
    loading,
    configured: signedIn,
    plan,
    schoolPlan,
    documentsUsed,
    documentsLimit: DOCUMENT_LIMIT,
    daysLeft,
    blocked,
    reason,
    recordDocumentSave,
  };
}
