"use client";
import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { useAuth } from "@/lib/supabase/AuthContext";
import { useOnboardingProgress, statusLabel } from "@/lib/hooks/useOnboardingProgress";
import type { StepStatus } from "@/lib/hooks/useOnboardingProgress";

export default function DashboardPage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name?.split(" ")[0] ?? "Guru";
  const progress = useOnboardingProgress();

  const tahunKelasStatus: StepStatus =
    progress.tahunPelajaran === "done" && progress.mapelKelas === "done"
      ? "done"
      : progress.tahunPelajaran === "empty" && progress.mapelKelas === "empty"
        ? "empty"
        : "progress";

  const steps: { label: string; status: StepStatus }[] = [
    { label: "Profil guru", status: progress.guru },
    { label: "Profil sekolah/madrasah", status: progress.sekolah },
    { label: "Tahun pelajaran & kelas", status: tahunKelasStatus },
    { label: "Kalender akademik", status: progress.kalenderAkademik },
    { label: "Perangkat pembelajaran", status: progress.perangkatPembelajaran },
  ];
  const doneCount = steps.filter((step) => step.status === "done").length;
  const percent = Math.round((doneCount / steps.length) * 100);

  const stepDescription = (status: StepStatus) =>
    status === "done" ? "Selesai" : status === "progress" ? "Perlu dilengkapi" : "Belum dimulai";

  return (
    <AppShell>
      <PageHeader title={`Selamat datang, ${name}`} description="Selesaikan data dasar terlebih dahulu agar perangkat pembelajaran dapat dibuat otomatis." action={<Link href="/master-data" className="button button-primary">Lengkapi data</Link>} />
      <section className="stats-grid" aria-label="Ringkasan">
        <article className="stat-card">
          <span>PROGRES ADMINISTRASI</span>
          <strong>{progress.loading ? "…" : `${percent}%`}</strong>
          <div className="progress"><i style={{ width: `${percent}%` }} /></div>
          <small>{doneCount} dari {steps.length} tahap data dasar selesai</small>
        </article>
        <article className="stat-card">
          <span>DOKUMEN TERSIMPAN</span>
          <strong>{progress.loading ? "…" : progress.documentsCount}</strong>
          <small>Mulai dari kalender akademik Anda</small>
        </article>
        <article className="stat-card">
          <span>KELAS & MAPEL</span>
          <strong>{progress.loading ? "…" : progress.classesCount}</strong>
          <small>Tambahkan penugasan mengajar</small>
        </article>
      </section>
      <section className="content-grid">
        <article className="panel">
          <div className="panel-title"><div><h2>Checklist perangkat</h2><p>Alur kerja yang saling terhubung</p></div><Link href="/perencanaan">Lihat perencanaan →</Link></div>
          <ol className="checklist">
            {steps.map((step, index) => (
              <li key={step.label}>
                <span className={`step ${step.status === "done" ? "done" : step.status === "progress" ? "current" : ""}`}>{step.status === "done" ? "✓" : index + 1}</span>
                <div><strong>{step.label}</strong><small>{stepDescription(step.status)}</small></div>
              </li>
            ))}
          </ol>
        </article>
        <article className="panel quick-actions">
          <div className="panel-title"><div><h2>Mulai dari sini</h2><p>Data sekali, dipakai di semua dokumen.</p></div></div>
          {[["01", "Profil Guru", "Identitas, NIP/NUPTK, jabatan dan tanda tangan.", "/master-data/guru"], ["02", "Profil Sekolah/Madrasah", "Identitas sekolah/madrasah, kepala sekolah/madrasah, dan aset.", "/master-data/madrasah"], ["03", "Tahun Pelajaran & Kelas", "Menjadi dasar kalender dan perangkat ajar.", "/master-data"]].map(([number, title, detail, href]) => (
            <Link href={href} className="action-card" key={title}><span>{number}</span><div><strong>{title}</strong><p>{detail}</p></div><b>→</b></Link>
          ))}
        </article>
      </section>
    </AppShell>
  );
}
