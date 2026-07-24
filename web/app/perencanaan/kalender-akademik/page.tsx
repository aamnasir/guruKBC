"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./calendar.module.css";

type CalendarEvent = { id: string; title: string; type: "Libur" | "Kegiatan" | "Hari efektif"; startDate: string; endDate: string };

// Hari libur nasional resmi (SKB 3 Menteri Kemenag/Kemenaker/PANRB, ditetapkan 19 Sept 2025)
// untuk periode Juli-Desember 2026. Semester genap (Jan-Jun 2027) BELUM diisi otomatis
// karena SKB 2027 belum diterbitkan pemerintah (biasanya terbit akhir tahun) -- lihat
// catatan di halaman. Jangan tambahkan tanggal 2027 di sini sebelum SKB resmi terbit.
const OFFICIAL_HOLIDAYS_2026_SEMESTER_1: Omit<CalendarEvent, "id">[] = [
  { title: "Hari Kemerdekaan RI", type: "Libur", startDate: "2026-08-17", endDate: "2026-08-17" },
  { title: "Maulid Nabi Muhammad SAW", type: "Libur", startDate: "2026-08-25", endDate: "2026-08-25" },
  { title: "Cuti Bersama Hari Raya Natal", type: "Libur", startDate: "2026-12-24", endDate: "2026-12-24" },
  { title: "Hari Raya Natal", type: "Libur", startDate: "2026-12-25", endDate: "2026-12-25" },
];

function formatDate(value: string) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)); }
function countWeekdays(start: string, end: string, events: CalendarEvent[]) { const cursor = new Date(`${start}T00:00:00`); const finish = new Date(`${end}T00:00:00`); let total = 0; while (cursor <= finish) { const date = cursor.toISOString().slice(0, 10); const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6; const isHoliday = events.some((event) => event.type === "Libur" && event.startDate <= date && event.endDate >= date); if (!isWeekend && !isHoliday) total += 1; cursor.setDate(cursor.getDate() + 1); } return total; }

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [year, setYear] = useState({ name: "2026/2027", start: "2026-07-13", end: "2027-06-19" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const data = storage.getItem<{ events: CalendarEvent[]; year: typeof year }>("gurukbc-academic-calendar");
    if (data) { setEvents(data.events ?? []); setYear(data.year ?? year); }
  }, []);

  const effectiveDays = useMemo(() => countWeekdays(year.start, year.end, events), [events, year.end, year.start]);
  const holidays = events.filter((event) => event.type === "Libur").length;
  const updateYear = (key: "name" | "start" | "end", value: string) => { setYear({ ...year, [key]: value }); setSaved(false); };
  const saveCalendar = () => {
    storage.setItem("gurukbc-academic-calendar", { events, year });
    setSaved(true);
  };
  function autoFillHolidays() {
    setEvents((current) => {
      const existingTitles = new Set(current.map((event) => `${event.title}-${event.startDate}`));
      const additions = OFFICIAL_HOLIDAYS_2026_SEMESTER_1
        .filter((holiday) => !existingTitles.has(`${holiday.title}-${holiday.startDate}`))
        .map((holiday) => ({ ...holiday, id: crypto.randomUUID() }));
      return [...current, ...additions].sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
    setSaved(false);
  }
  function addEvent(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const startDate = String(form.get("startDate")); const endDate = String(form.get("endDate")); if (endDate < startDate) { setError("Tanggal selesai tidak boleh lebih awal dari tanggal mulai."); return; } setEvents((current) => [...current, { id: crypto.randomUUID(), title: String(form.get("title")).trim(), type: String(form.get("type")) as CalendarEvent["type"], startDate, endDate }].sort((a, b) => a.startDate.localeCompare(b.startDate))); setError(""); setSaved(false); event.currentTarget.reset(); }
  return <AppShell><PageHeader eyebrow="PERENCANAAN / KALENDER AKADEMIK" title="Kalender Akademik" description="Tetapkan periode belajar, hari libur, dan kegiatan sekolah sebagai dasar analisis hari efektif." />
    <section className={styles.summary} aria-label="Ringkasan kalender"><article><span>TAHUN PELAJARAN</span><strong>{year.name}</strong><small>{formatDate(year.start)} - {formatDate(year.end)}</small></article><article><span>ESTIMASI HARI EFEKTIF</span><strong>{effectiveDays}</strong><small>Senin-Jumat, di luar hari libur</small></article><article><span>HARI LIBUR TERCATAT</span><strong>{holidays}</strong><small>{events.length} agenda dalam kalender</small></article></section>
    <div className={styles.layout}><section className="form-panel"><h2 className={styles.title}>Periode tahun pelajaran</h2><p className={styles.description}>Pastikan rentang tanggal sesuai keputusan madrasah.</p><div className="form-grid"><label className="full">Nama tahun pelajaran<input value={year.name} onChange={(event) => updateYear("name", event.target.value)} /></label><label>Tanggal mulai<input type="date" value={year.start} onChange={(event) => updateYear("start", event.target.value)} /></label><label>Tanggal selesai<input type="date" value={year.end} onChange={(event) => updateYear("end", event.target.value)} /></label></div><div className={styles.autoFillBox}><div><strong>Isi otomatis hari libur nasional</strong><p>Semester ganjil (Jul-Des 2026) sesuai SKB 3 Menteri resmi. Semester genap (Jan-Jun 2027) belum bisa diisi otomatis karena SKB 2027 belum diterbitkan pemerintah (biasanya terbit akhir tahun) — tambahkan manual setelah resmi terbit.</p></div><button type="button" className={`button ${styles.secondary}`} onClick={autoFillHolidays}>Isi otomatis</button></div><div className="form-actions"><span>{saved ? "Kalender tersimpan dan disinkronkan ke Supabase." : "Simpan setelah memperbarui periode atau agenda."}</span><button type="button" className="button button-primary" onClick={saveCalendar}>Simpan kalender</button></div></section>
      <form className={`form-panel ${styles.eventForm}`} onSubmit={addEvent}><h2 className={styles.title}>Tambah agenda</h2><p className={styles.description}>Tandai libur agar tidak dihitung sebagai hari efektif.</p><label>Nama agenda<input name="title" required placeholder="Contoh: Libur Idulfitri" /></label><label>Jenis agenda<select name="type" defaultValue="Libur"><option>Libur</option><option>Kegiatan</option><option>Hari efektif</option></select></label><div className={styles.dateRow}><label>Tanggal mulai<input name="startDate" type="date" min={year.start} max={year.end} required /></label><label>Tanggal selesai<input name="endDate" type="date" min={year.start} max={year.end} required /></label></div>{error && <p className={styles.error} role="alert">{error}</p>}<button className={`button ${styles.secondary}`}>Tambah ke kalender</button></form></div>
    <section className={`panel ${styles.events}`}><div className="panel-title"><div><h2>Agenda kalender</h2><p>Urut berdasarkan tanggal mulai.</p></div><span className="status">{events.length} agenda</span></div>{events.length === 0 ? <div className={styles.empty}><strong>Belum ada agenda.</strong><span>Tambahkan hari libur dan kegiatan sekolah untuk melengkapi kalender.</span></div> : <ul>{events.map((event) => <li key={event.id}><span className={`${styles.dot} ${event.type === "Libur" ? styles.holiday : event.type === "Hari efektif" ? styles.effective : styles.activity}`} /><div><strong>{event.title}</strong><small>{formatDate(event.startDate)}{event.endDate !== event.startDate ? ` - ${formatDate(event.endDate)}` : ""}</small></div><em>{event.type}</em><button type="button" onClick={() => { setEvents((current) => current.filter((item) => item.id !== event.id)); setSaved(false); }}>Hapus</button></li>)}</ul>}</section>
  </AppShell>;
}
