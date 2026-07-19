import Link from "next/link";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";

const stages = [
  ["Kalender Akademik", "Atur periode belajar, hari libur, dan kegiatan sekolah.", "/perencanaan/kalender-akademik", "Buka kalender akademik"],
  ["Analisis Hari Efektif", "Dihitung otomatis dari kalender akademik.", "/perencanaan/analisis-hari-efektif", "Lihat analisis hari efektif"],
  ["Analisis Pekan Efektif", "Distribusikan minggu efektif dan jam pelajaran.", "/perencanaan/analisis-pekan-efektif", "Lihat analisis pekan efektif"],
  ["PROTA", "Bangun program tahunan dari TP dan distribusi JP.", "/perencanaan/prota", "Susun PROTA"],
  ["PROMES", "Distribusikan TP ke pekan efektif berdasarkan PROTA.", "/perencanaan/promes", "Susun PROMES"],
  ["KKTP", "Tetapkan kriteria ketercapaian berdasarkan TP dan PROMES.", "/perencanaan/kktp", "Susun KKTP"],
  ["Modul Ajar", "Rangkai perangkat ajar KBC dari TP, PROMES, dan KKTP.", "/perencanaan/modul-ajar", "Buat Modul Ajar"],
  ["Asesmen", "Susun instrumen dan rubrik yang selaras dengan KKTP.", "/perencanaan/asesmen", "Buat Asesmen"],
];

export default function PlanningPage() {
  return <AppShell><PageHeader eyebrow="PERENCANAAN" title="Rancang perangkat secara berurutan" description="Setiap tahap memanfaatkan data dari tahap sebelumnya agar tidak ada input ganda." /><section className="timeline">{stages.map(([title, detail, href, action], index) => <article key={title}><span>{index + 1}</span><div><h2>{title}</h2><p>{detail}</p>{href ? <Link className="text-link" href={href}>{action} &rarr;</Link> : <small>Terkunci sampai tahap sebelumnya selesai</small>}</div></article>)}</section></AppShell>;
}
