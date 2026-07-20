"use client"; // <--- TAMBAHKAN INI DI BARIS PERTAMA

import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";

const records = [
  ["Profil Guru", "Identitas dan data profesional", "/master-data/guru", "Lengkap"],
  ["Profil Madrasah", "Identitas institusi dan aset dokumen", "/master-data/madrasah", "Lengkap"],
  ["Tahun Pelajaran", "Tahun aktif, semester, dan beban belajar", "/master-data/tahun-pelajaran", "Belum diisi"],
  ["Mata Pelajaran & Kelas", "Penugasan mengajar dan peserta didik", "/master-data/mata-pelajaran", "Belum diisi"]
];

export const dynamic = 'force-dynamic'; // <--- TAMBAHKAN INI

export default function MasterDataPage() {
  return (
    <AppShell>
      <PageHeader 
        eyebrow="MASTER DATA" 
        title="Satu sumber data untuk semua perangkat" 
        description="Lengkapi data pokok sebelum masuk ke tahap perencanaan." 
      />
      <section className="record-list">
        {records.map(([title, detail, href, status]) => (
          <Link href={href} key={title} className="record-row">
            <div>
              <h2>{title}</h2>
              <p>{detail}</p>
            </div>
            <span className={status === "Lengkap" ? "status success" : "status"}>
              {status}
            </span>
            <b>→</b>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
