"use client";

import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./effective-days.module.css";

type CalendarEvent = { id: string; title: string; type: "Libur" | "Kegiatan" | "Hari efektif"; startDate: string; endDate: string };
type CalendarData = { events: CalendarEvent[]; year: { name: string; start: string; end: string } };
type MonthAnalysis = { month: Date; semester: 1 | 2; weekdays: number; holidayDays: number; effectiveDays: number };

function formatMonth(date: Date) { return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date); }

function calculate(calendar: CalendarData): MonthAnalysis[] {
  const first = new Date(`${calendar.year.start}T00:00:00`); const last = new Date(`${calendar.year.end}T00:00:00`); const rows: MonthAnalysis[] = [];
  function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
  function nextMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 1); }
  function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
  for (let month = startOfMonth(first); month <= last; month = nextMonth(month)) { let weekdays = 0; let holidayDays = 0; const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0); const begin = first > month ? first : month; const finish = last < monthEnd ? last : monthEnd; for (let day = new Date(begin); day <= finish; day.setDate(day.getDate() + 1)) { if (day.getDay() === 0 || day.getDay() === 6) continue; weekdays += 1; const value = dateKey(day); if (calendar.events.some((event) => event.type === "Libur" && event.startDate <= value && event.endDate >= value)) holidayDays += 1; } rows.push({ month: new Date(month), semester: month.getMonth() <= 5 ? 2 : 1, weekdays, holidayDays, effectiveDays: weekdays - holidayDays }); }
  return rows;
}

export default function EffectiveDaysPage() {
  const [calendar, setCalendar] = useState<CalendarData>({ events: [], year: { name: "2026/2027", start: "2026-07-13", end: "2027-06-19" } });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    storage.getItem<CalendarData>("gurukbc-academic-calendar").then((data) => {
      if (data) setCalendar(data);
    });
  }, []);

  const rows = useMemo(() => calculate(calendar), [calendar]);
  const semesterOne = rows.filter((row) => row.semester === 1); const semesterTwo = rows.filter((row) => row.semester === 2);
  const total = rows.reduce((sum, row) => sum + row.effectiveDays, 0); const holidays = rows.reduce((sum, row) => sum + row.holidayDays, 0);
  const saveAnalysis = async () => { await storage.setItem("gurukbc-effective-days", { year: calendar.year, rows, calculatedAt: new Date().toISOString() }); setSaved(true); };
  const table = (items: MonthAnalysis[], title: string) => <section className={`panel ${styles.tablePanel}`}><div className="panel-title"><div><h2>{title}</h2><p>Senin-Jumat dikurangi hari libur yang tercatat.</p></div><strong>{items.reduce((sum, row) => sum + row.effectiveDays, 0)} hari</strong></div><div className={styles.tableWrap}><table><thead><tr><th>Bulan</th><th>Hari kerja</th><th>Libur</th><th>Hari efektif</th></tr></thead><tbody>{items.map((row) => <tr key={row.month.toISOString()}><td>{formatMonth(row.month)}</td><td>{row.weekdays}</td><td>{row.holidayDays}</td><td><b>{row.effectiveDays}</b></td></tr>)}</tbody></table></div></section>;
  return <AppShell><PageHeader eyebrow="PERENCANAAN / ANALISIS HARI EFEKTIF" title="Analisis Hari Efektif" description="Perhitungan otomatis berdasarkan periode tahun pelajaran dan hari libur dari Kalender Akademik." action={<button className="button button-primary" onClick={saveAnalysis}>Simpan analisis</button>} />
    <section className={styles.summary}><article><span>TAHUN PELAJARAN</span><strong>{calendar.year.name}</strong><small>Data dari Kalender Akademik</small></article><article><span>TOTAL HARI EFEKTIF</span><strong>{total}</strong><small>Hari belajar Senin-Jumat</small></article><article><span>LIBUR HARI KERJA</span><strong>{holidays}</strong><small>Libur akhir pekan tidak dihitung</small></article></section>
    {calendar.events.length === 0 && <div className={styles.notice}><strong>Kalender belum memuat agenda libur.</strong><span>Perhitungan saat ini hanya mengurangi akhir pekan. Tambahkan hari libur di Kalender Akademik agar hasil lebih akurat.</span></div>}
    <div className={styles.tables}>{table(semesterOne, "Semester 1")} {table(semesterTwo, "Semester 2")}</div>
    <p className={styles.saved}>{saved ? "Analisis tersimpan dan disinkronkan ke Supabase." : "Simpan hasil setelah kalender akademik final."}</p>
  </AppShell>;
}
