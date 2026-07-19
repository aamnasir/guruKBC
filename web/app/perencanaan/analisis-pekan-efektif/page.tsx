"use client";

import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./effective-weeks.module.css";

type CalendarEvent = { id: string; type: "Libur" | "Kegiatan" | "Hari efektif"; startDate: string; endDate: string };
type CalendarData = { events: CalendarEvent[]; year: { name: string; start: string; end: string } };
type Week = { number: number; semester: 1 | 2; start: Date; end: Date; effectiveDays: number };

function key(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function formatDate(date: Date) { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date); }
function mondayOf(date: Date) { const result = new Date(date); const offset = (result.getDay() + 6) % 7; result.setDate(result.getDate() - offset); result.setHours(0, 0, 0, 0); return result; }

function calculateWeeks(calendar: CalendarData): Week[] {
  const first = new Date(`${calendar.year.start}T00:00:00`); const last = new Date(`${calendar.year.end}T00:00:00`); const rows: Week[] = []; let number = 1;
  for (let start = mondayOf(first); start <= last; start.setDate(start.getDate() + 7)) { const weekStart = new Date(start); const end = new Date(start); end.setDate(end.getDate() + 6); let effectiveDays = 0; let semester: 1 | 2 = 1; for (let offset = 0; offset < 5; offset += 1) { const day = new Date(start); day.setDate(day.getDate() + offset); if (day < first || day > last) continue; if (day.getMonth() <= 5) semester = 2; const value = key(day); const holiday = calendar.events.some((event) => event.type === "Libur" && event.startDate <= value && event.endDate >= value); if (!holiday) effectiveDays += 1; } rows.push({ number, semester, start: weekStart, end, effectiveDays }); number += 1; }
  return rows;
}

export default function EffectiveWeeksPage() {
  const [calendar, setCalendar] = useState<CalendarData>({ events: [], year: { name: "2026/2027", start: "2026-07-13", end: "2027-06-19" } });
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [saved, setSaved] = useState(false);

 useEffect(() => {
  const data = storage.getItem<CalendarData>("gurukbc-academic-calendar");
  if (data) setCalendar(data);
}, []);


  const weeks = useMemo(() => calculateWeeks(calendar), [calendar]);
  const estimatedHours = (week: Week) => Math.round((week.effectiveDays / 5) * weeklyHours);
  const semOne = weeks.filter((week) => week.semester === 1); const semTwo = weeks.filter((week) => week.semester === 2);
  const effectiveWeeks = weeks.filter((week) => week.effectiveDays > 0).length; const totalHours = weeks.reduce((sum, week) => sum + estimatedHours(week), 0);
  const saveAnalysis = async () => { await storage.setItem("gurukbc-effective-weeks", { year: calendar.year, weeklyHours, weeks: weeks.map((week) => ({ ...week, estimatedHours: estimatedHours(week) })), calculatedAt: new Date().toISOString() }); setSaved(true); };
  const table = (items: Week[], title: string) => <section className={`panel ${styles.tablePanel}`}><div className="panel-title"><div><h2>{title}</h2><p>JP disesuaikan secara proporsional pada minggu tidak penuh.</p></div><strong>{items.filter((week) => week.effectiveDays > 0).length} pekan</strong></div><div className={styles.tableWrap}><table><thead><tr><th>Pekan</th><th>Rentang</th><th>Hari efektif</th><th>Estimasi JP</th></tr></thead><tbody>{items.map((week) => <tr key={week.number}><td>{week.number}</td><td>{formatDate(week.start)} - {formatDate(week.end)}</td><td>{week.effectiveDays}</td><td><b>{estimatedHours(week)}</b></td></tr>)}</tbody></table></div></section>;
  return <AppShell><PageHeader eyebrow="PERENCANAAN / ANALISIS PEKAN EFEKTIF" title="Analisis Pekan Efektif" description="Distribusikan minggu belajar dan estimasi jam pelajaran dari Kalender Akademik." action={<button className="button button-primary" onClick={saveAnalysis}>Simpan analisis</button>} />
    <section className={styles.summary}><article><span>TAHUN PELAJARAN</span><strong>{calendar.year.name}</strong><small>Data dari Kalender Akademik</small></article><article><span>PEKAN EFEKTIF</span><strong>{effectiveWeeks}</strong><small>Dari {weeks.length} pekan kalender</small></article><article><span>ESTIMASI TOTAL JP</span><strong>{totalHours}</strong><small>Berdasarkan beban JP per minggu</small></article></section>
    <section className={`form-panel ${styles.settings}`}><div><h2>Beban jam pelajaran</h2><p>Gunakan beban JP per minggu untuk memperkirakan distribusi pada setiap pekan efektif.</p></div><label>JP per minggu<input type="number" min="1" max="60" value={weeklyHours} onChange={(event) => { setWeeklyHours(Math.max(1, Number(event.target.value))); setSaved(false); }} /></label></section>
    {calendar.events.length === 0 && <div className={styles.notice}><strong>Belum ada hari libur.</strong><span>Tambahkan agenda libur pada Kalender Akademik agar minggu efektif dan estimasi JP lebih akurat.</span></div>}
    <div className={styles.tables}>{table(semOne, "Semester 1")} {table(semTwo, "Semester 2")}</div><p className={styles.saved}>{saved ? "Analisis tersimpan dan disinkronkan ke Supabase." : "Simpan hasil setelah beban JP dan kalender akademik final."}</p>
  </AppShell>;
}
