"use client";

import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { useOnboardingProgress, statusLabel, statusBadgeClass } from "@/lib/hooks/useOnboardingProgress";
import type { StepStatus } from "@/lib/hooks/useOnboardingProgress";

export default function MasterDataPage() {
  const progress = useOnboardingProgress();

  const records: { title: string; detail: string; href: string; status: StepStatus }[] = [
    { title: "Profil Guru", detail: "Identitas dan data profesional", href: "/master-data/guru", status: progress.guru },
    { title: "Profil Sekolah/Madrasah", detail: "Identitas institusi dan aset dokumen", href: "/master-data/madrasah", status: progress.sekolah },
    { title: "Tahun Pelajaran", detail: "Tahun aktif, semester, dan beban belajar", href: "/master-data/tahun-pelajaran", status: progress.tahunPelajaran },
    { title: "Mata Pelajaran & Kelas", detail: "Penugasan mengajar dan peserta didik", href: "/master-data/mata-pelajaran", status: progress.mapelKelas },
    { title: "Pengaturan Aset", detail: "Logo sekolah/madrasah dan tanda tangan kepala sekolah/madrasah", href: "/master-data/aset", status: progress.aset },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="MASTER DATA"
        title="Satu sumber data untuk semua perangkat"
        description="Lengkapi data pokok sebelum masuk ke tahap perencanaan."
      />
      <section className="record-list">
        {records.map((record) => (
          <Link href={record.href} key={record.title} className="record-row">
            <div>
              <h2>{record.title}</h2>
              <p>{record.detail}</p>
            </div>
            <span className={`status ${progress.loading ? "" : statusBadgeClass(record.status)}`}>
              {progress.loading ? "Memuat..." : statusLabel(record.status)}
            </span>
            <b>→</b>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
