"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./prota.module.css";

type Objective = { id: string; code: string; description: string; semester: 1 | 2; hours: number };
type WeekAnalysis = { year?: { name?: string }; weeks?: { semester: 1 | 2; estimatedHours?: number }[] };
type ProtaData = { meta?: { subject?: string; grade?: string; year?: string }; objectives?: Objective[] };

function readProta(): ProtaData { return storage.getItem<ProtaData>("gurukbc-prota"); }

export default function ProtaPage() {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [meta, setMeta] = useState({ subject: "", grade: "", year: "2026/2027" });
  const [saved, setSaved] = useState(false); const [error, setError] = useState("");

  useEffect(() => {
      const data = readProta();
      if (data.objectives?.length) { setObjectives(data.objectives); setMeta({ subject: data.meta?.subject ?? "", grade: data.meta?.grade ?? "", year: data.meta?.year ?? "2026/2027" }); }
    }, []);

  const [analysis] = useState<WeekAnalysis>({});
  const capacity = useMemo(() => ({ one: analysis.weeks?.filter((week) => week.semester === 1).reduce((total, week) => total + (week.estimatedHours ?? 0), 0) ?? 0, two: analysis.weeks?.filter((week) => week.semester === 2).reduce((total, week) => total + (week.estimatedHours ?? 0), 0) ?? 0 }), [analysis]);
  const required = { one: objectives.filter((item) => item.semester === 1).reduce((total, item) => total + item.hours, 0), two: objectives.filter((item) => item.semester === 2).reduce((total, item) => total + item.hours, 0) };
  function addObjective(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const description = String(data.get("description")).trim(); if (!description) return; setObjectives((items) => [...items, { id: crypto.randomUUID(), code: String(data.get("code")).trim() || `TP ${items.length + 1}`, description, semester: Number(data.get("semester")) as 1 | 2, hours: Math.max(1, Number(data.get("hours"))) }]); setSaved(false); setError(""); event.currentTarget.reset(); }
  function removeObjective(id: string) { setObjectives((items) => items.filter((item) => item.id !== id)); setSaved(false); }
  const saveProta = () => { if (!meta.subject.trim() || !meta.grade.trim() || objectives.length === 0) { setError("Lengkapi mata pelajaran, kelas, dan minimal satu tujuan pembelajaran."); return; } storage.setItem("gurukbc-prota", { meta, objectives, updatedAt: new Date().toISOString() }); setError(""); setSaved(true); };
  const balance = (semester: 1 | 2) => { const data = semester === 1 ? { required: required.one, capacity: capacity.one } : { required: required.two, capacity: capacity.two }; return data.capacity === 0 ? "Simpan Analisis Pekan Efektif untuk melihat kapasitas JP." : data.required <= data.capacity ? `Alokasi aman: sisa ${data.capacity - data.required} JP.` : `Kelebihan ${data.required - data.capacity} JP dari kapasitas.`; };
  return <AppShell><PageHeader eyebrow="PERENCANAAN / PROTA" title="Program Tahunan (PROTA)" description="Susun distribusi tujuan pembelajaran dan jam pelajaran untuk satu tahun ajaran." action={<div className={styles.actions}><button className={`button ${styles.secondary}`} onClick={() => window.print()}>Cetak / PDF</button><button className="button button-primary" onClick={saveProta}>Simpan PROTA</button></div>} />
    <section className={styles.layout}><div className={styles.editor}><section className="form-panel"><h2 className={styles.title}>Identitas perangkat</h2><div className="form-grid"><label>Mata pelajaran<input value={meta.subject} onChange={(event) => { setMeta({ ...meta, subject: event.target.value }); setSaved(false); }} placeholder="Contoh: Fikih" /></label><label>Kelas / fase<input value={meta.grade} onChange={(event) => { setMeta({ ...meta, grade: event.target.value }); setSaved(false); }} placeholder="Contoh: Kelas IV / Fase B" /></label><label className="full">Tahun pelajaran<input value={meta.year} onChange={(event) => { setMeta({ ...meta, year: event.target.value }); setSaved(false); }} /></label></div></section>
      <form className={`form-panel ${styles.objectiveForm}`} onSubmit={addObjective}><h2 className={styles.title}>Tambah tujuan pembelajaran</h2><div className="form-grid"><label>Kode TP<input name="code" placeholder="Contoh: TP 1" /></label><label>Semester<select name="semester" defaultValue="1"><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label><label className="full">Tujuan pembelajaran<textarea name="description" rows={3} required placeholder="Masukkan rumusan tujuan pembelajaran" /></label><label>Alokasi JP<input name="hours" type="number" min="1" defaultValue="4" required /></label></div><button className={`button ${styles.secondary}`}>Tambah TP</button></form>
      <section className={`panel ${styles.allocation}`}><div className="panel-title"><div><h2>Validasi alokasi JP</h2><p>Dibandingkan dengan Analisis Pekan Efektif.</p></div></div><div><p><strong>Semester 1:</strong> {required.one} / {capacity.one || "-"} JP</p><small>{balance(1)}</small></div><div><p><strong>Semester 2:</strong> {required.two} / {capacity.two || "-"} JP</p><small>{balance(2)}</small></div></section>
      <section className={`panel ${styles.objectives}`}><div className="panel-title"><div><h2>Daftar tujuan pembelajaran</h2><p>Hapus TP yang belum sesuai sebelum menyimpan dokumen.</p></div><strong>{objectives.length} TP</strong></div>{objectives.length === 0 ? <p className={styles.empty}>Belum ada tujuan pembelajaran.</p> : <ol>{objectives.map((item) => <li key={item.id}><div><strong>{item.code}</strong><span>Semester {item.semester} · {item.hours} JP</span><p>{item.description}</p></div><button type="button" onClick={() => removeObjective(item.id)} aria-label={`Hapus ${item.code}`}>Hapus</button></li>)}</ol>}</section></div>
      <section className={styles.previewWrap}><p className={styles.previewLabel}>PRATINJAU A4</p><article className={styles.preview}><header><p>PROGRAM TAHUNAN</p><h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2><span>Tahun Pelajaran {meta.year}</span></header><dl><div><dt>Satuan Pendidikan</dt><dd>Madrasah</dd></div><div><dt>Mata Pelajaran</dt><dd>{meta.subject || "-"}</dd></div><div><dt>Kelas / Fase</dt><dd>{meta.grade || "-"}</dd></div></dl><table><thead><tr><th>No.</th><th>Tujuan Pembelajaran</th><th>Semester</th><th>Alokasi JP</th></tr></thead><tbody>{objectives.length === 0 ? <tr><td colSpan={4} className={styles.placeholder}>Tambahkan tujuan pembelajaran untuk membuat PROTA.</td></tr> : objectives.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><b>{item.code}</b><span>{item.description}</span></td><td>{item.semester}</td><td>{item.hours}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>Jumlah JP</td><td>{required.one + required.two}</td></tr></tfoot></table><footer><span>Mengetahui,<br />Kepala Madrasah</span><span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span></footer></article></section></section>
    {error && <p className={styles.error} role="alert">{error}</p>}<p className={styles.saved}>{saved ? "PROTA tersimpan dan disinkronkan ke Supabase." : "Dokumen tersimpan lokal hingga Supabase dikonfigurasi."}</p>
  </AppShell>;
}