"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/supabase/storage";
import { getUserSchoolId, getSchoolAssets } from "@/lib/supabase/queries";

export type StepStatus = "empty" | "progress" | "done";

export type OnboardingProgress = {
  loading: boolean;
  guru: StepStatus;
  sekolah: StepStatus;
  tahunPelajaran: StepStatus;
  mapelKelas: StepStatus;
  aset: StepStatus;
  kalenderAkademik: StepStatus;
  perangkatPembelajaran: StepStatus;
  classesCount: number;
  documentsCount: number;
};

const EMPTY_PROGRESS: OnboardingProgress = {
  loading: true,
  guru: "empty",
  sekolah: "empty",
  tahunPelajaran: "empty",
  mapelKelas: "empty",
  aset: "empty",
  kalenderAkademik: "empty",
  perangkatPembelajaran: "empty",
  classesCount: 0,
  documentsCount: 0,
};

export function statusLabel(status: StepStatus, doneLabel = "Lengkap", progressLabel = "Sedang diisi", emptyLabel = "Belum diisi"): string {
  return status === "done" ? doneLabel : status === "progress" ? progressLabel : emptyLabel;
}

export function statusBadgeClass(status: StepStatus): string {
  return status === "done" ? "success" : status === "progress" ? "progress" : "warning";
}

export function useOnboardingProgress(): OnboardingProgress {
  const [state, setState] = useState<OnboardingProgress>(EMPTY_PROGRESS);

  useEffect(() => {
    const profile = storage.getItem<Partial<{ full_name: string }>>("gurukbc-profile");
    const guru: StepStatus = profile?.full_name?.trim() ? "done" : "empty";

    const school = storage.getItem<Partial<{ name: string }>>("gurukbc-school");
    const sekolah: StepStatus = school?.name?.trim() ? "done" : "empty";

    const year = storage.getItem<Partial<{ name: string; start_date: string; end_date: string }>>("gurukbc-academic-year");
    const tahunPelajaran: StepStatus = year?.name?.trim() && year?.start_date && year?.end_date ? "done" : "empty";

    const mapel = storage.getItem<Partial<{ subjects: unknown[]; classes: unknown[] }>>("gurukbc-mapel-kelas");
    const subjectsFilled = (mapel?.subjects?.length ?? 0) > 0;
    const classesFilled = (mapel?.classes?.length ?? 0) > 0;
    const mapelKelas: StepStatus = subjectsFilled && classesFilled ? "done" : subjectsFilled || classesFilled ? "progress" : "empty";

    const calendar = storage.getItem<Partial<{ events: unknown[] }>>("gurukbc-academic-calendar");
    const kalenderAkademik: StepStatus = (calendar?.events?.length ?? 0) > 0 ? "done" : "empty";

    const prota = storage.getItem<Partial<{ objectives: unknown[] }>>("gurukbc-prota");
    const promes = storage.getItem<Partial<{ allocations: unknown[] }>>("gurukbc-promes");
    const kktp = storage.getItem<Partial<{ criteria: unknown[] }>>("gurukbc-kktp");
    const modules = storage.getItem<Partial<{ modules: unknown[] }>>("gurukbc-teaching-modules");
    const assessments = storage.getItem<Partial<{ assessments: unknown[] }>>("gurukbc-assessments");

    const protaStarted = (prota?.objectives?.length ?? 0) > 0;
    const chainDone = protaStarted && (promes?.allocations?.length ?? 0) > 0 && (kktp?.criteria?.length ?? 0) > 0;
    const perangkatPembelajaran: StepStatus = chainDone ? "done" : protaStarted ? "progress" : "empty";

    const documentsCount =
      (protaStarted ? 1 : 0) +
      ((promes?.allocations?.length ?? 0) > 0 ? 1 : 0) +
      ((kktp?.criteria?.length ?? 0) > 0 ? 1 : 0) +
      (modules?.modules?.length ?? 0) +
      (assessments?.assessments?.length ?? 0);

    setState((current) => ({
      ...current,
      guru,
      sekolah,
      tahunPelajaran,
      mapelKelas,
      kalenderAkademik,
      perangkatPembelajaran,
      classesCount: mapel?.classes?.length ?? 0,
      documentsCount,
    }));

    (async () => {
      const schoolId = await getUserSchoolId();
      let aset: StepStatus = "empty";
      if (schoolId) {
        const { data } = await getSchoolAssets(schoolId);
        const rows = data ?? [];
        const hasLogo = rows.some((row: { asset_type: string }) => row.asset_type === "logo");
        const hasSignature = rows.some((row: { asset_type: string }) => row.asset_type === "signature");
        aset = hasLogo && hasSignature ? "done" : hasLogo || hasSignature ? "progress" : "empty";
      }
      setState((current) => ({ ...current, aset, loading: false }));
    })();
  }, []);

  return state;
}
