"use client";

import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { useSchoolAssets } from "@/lib/hooks/useSchoolAssets";
import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { UpgradeBlock } from "@/app/components/UpgradeBlock";
import styles from "./promes.module.css";

type Objective = { id: string; code: string; description: string; semester: 1 | 2; hours: number };
type ProtaData = { meta?: { subject?: string; className?: string; year?: string }; objectives?: Objective[] };
type EffectiveWeek = { number: number; semester: 1 | 2; estimatedHours?: number; effectiveDays?: number };
type WeekData = { weeks?: EffectiveWeek[] };
type Allocation = { weekNumber: number; semester: 1 | 2; objectiveId: string; code: string; description: string; hours: number };

function readStorage<T>(key: string): T { return storage.getItem<T>(key); }
function validObjectives(value: ProtaData["objectives"]): Objective[] { return Array.isArray(value) ? value.filter((item): item is Objective => Boolean(item?.id && item.code && item.description && (item.semester === 1 || item.semester === 2) && Number.isFinite(item.hours) && item.hours > 0)) : []; }
function validWeeks(value: WeekData["weeks"]): EffectiveWeek[] { return Array.isArray(value) ? value.filter((item): item is EffectiveWeek => Boolean(Number.isFinite(item?.number) && (item.semester === 1 || item.semester === 2) && Number.isFinite(item.estimatedHours) && (item.estimatedHours ?? 0) > 0)) : []; }

function distribute(objectives: Objective[], weeks: EffectiveWeek[]): { allocations: Allocation[]; unallocated: Objective[] } {
  const available = weeks.map((week) => ({ ...week, remaining: week.estimatedHours ?? 0 }));
  const allocations: Allocation[] = []; const unallocated: Objective[] = [];
  for (const objective of objectives) { let remaining = objective.hours; for (const week of available.filter((item) => item.semester === objective.semester && item.remaining > 0)) { if (remaining === 0) break; const hours = Math.min(remaining, week.remaining); allocations.push({ weekNumber: week.number, semester: week.semester, objectiveId: objective.id, code: objective.code, description: objective.description, hours }); week.remaining -= hours; remaining -= hours; } if (remaining > 0) unallocated.push({ ...objective, hours: remaining }); }
  return { allocations, unallocated };
}

export default function PromesPage() {
  const { logoUrl, signatureUrl, headmasterName } = useSchoolAssets();
  const gate = useSubscriptionGate();
  const [prota, setProta] = useState<ProtaData>({});
  const [analysis, setAnalysis] = useState<WeekData>({});
  const [saved, setSaved] = useState(false);

useEffect(() => {
     setProta(readStorage<ProtaData>("gurukbc-prota"));
     setAnalysis(readStorage<WeekData>("gurukbc-effective-weeks"));
   }, []);

  const objectives = useMemo(() => validObjectives(prota.objectives), [prota.objectives]);
  const weeks = useMemo(() => validWeeks(analysis.weeks).sort((a, b) => a.number - b.number), [analysis.weeks]);
  const result = useMemo(() => distribute(objectives, weeks), [objectives, weeks]);
  const semesterRows = (semester: 1 | 2) => result.allocations.filter((item) => item.semester === semester);
  const totalHours = result.allocations.reduce((total, item) => total + item.hours, 0);
  const savePromes = async () => { if (!objectives.length || !weeks.length || result.unallocated.length) return; const allowed = await gate.recordDocumentSave(); if (!allowed) return; storage.setItem("gurukbc-promes", { meta: prota.meta, allocations: result.allocations, createdAt: new Date().toISOString() }); setSaved(true); };
  const table = (semester: 1 | 2) => <section className={`panel ${styles.tablePanel}`}><div className="panel-title"><div><h2>Semester {semester}</h2><p>{semesterRows(semester).length} distribusi TP pada pekan efektif.</p></div></div><div className={styles.tableWrap}><table><thead><tr><th>Pekan</th><th>Tujuan Pembelajaran</th><th>Alokasi JP</th></tr></thead><tbody>{semesterRows(semester).length === 0 ? <tr><td colSpan={3} className={styles.placeholder}>Belum ada alokasi semester {semester}.</td></tr> : semesterRows(semester).map((item, index) => <tr key={`${item.objectiveId}-${item.weekNumber}-${index}`}><td>{item.weekNumber}</td><td><b>{item.code}</b><span>{item.description}</span></td><td>{item.hours}</td></tr>)}</tbody></table></div></section>;
  const hasPrerequisites = objectives.length > 0 && weeks.length > 0;
  return <AppShell><PageHeader eyebrow="PERENCANAAN / PROMES" title="Program Semester (PROMES)" description="Distribusikan tujuan pembelajaran dari PROTA ke pekan efektif secara otomatis." action={<div className={styles.actions}><button className={`button ${styles.secondary}`} onClick={() => window.print()} disabled={!hasPrerequisites}>Cetak / PDF</button><button className="button button-primary" onClick={savePromes} disabled={!hasPrerequisites || result.unallocated.length > 0}>Simpan PROMES</button></div>} />
    <UpgradeBlock gate={gate} />
    {!hasPrerequisites ? <section className={`empty-state ${styles.notice}`}><h2>Data PROTA atau Analisis Pekan Efektif belum tersedia.</h2><p>Simpan PROTA dan Analisis Pekan Efektif terlebih dahulu agar distribusi TP dapat dibuat otomatis.</p></section> : <><section className={styles.summary}><article><span>TUJUAN PEMBELAJARAN</span><strong>{objectives.length}</strong><small>Dari PROTA</small></article><article><span>PEKAN TERSEDIA</span><strong>{weeks.length}</strong><small>Dari Analisis Pekan Efektif</small></article><article><span>JP TERDISTRIBUSI</span><strong>{totalHours}</strong><small>Ke dalam PROMES</small></article></section>
      {result.unallocated.length > 0 && <section className={styles.warning}><strong>Alokasi belum mencukupi.</strong><span>{result.unallocated.map((item) => `${item.code} (${item.hours} JP)`).join(", ")} belum memperoleh pekan efektif. Sesuaikan PROTA atau Analisis Pekan Efektif.</span></section>}
      <div className={styles.tables}>{table(1)}{table(2)}</div>
      <section className={styles.previewWrap}><p className={styles.previewLabel}>PRATINJAU A4</p><article className={styles.preview}><header>{logoUrl && <img src={logoUrl} alt="Logo madrasah" className={styles.previewLogo} />}<p>PROGRAM SEMESTER</p><h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2><span>Tahun Pelajaran {prota.meta?.year ?? "-"}</span></header><dl><div><dt>Mata Pelajaran</dt><dd>{prota.meta?.subject ?? "-"}</dd></div><div><dt>Kelas / Fase</dt><dd>{prota.meta?.className ?? "-"}</dd></div></dl><table><thead><tr><th>Semester</th><th>Pekan</th><th>Tujuan Pembelajaran</th><th>JP</th></tr></thead><tbody>{result.allocations.map((item, index) => <tr key={`${item.objectiveId}-${item.weekNumber}-${index}`}><td>{item.semester}</td><td>{item.weekNumber}</td><td><b>{item.code}</b><span>{item.description}</span></td><td>{item.hours}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>Jumlah JP</td><td>{totalHours}</td></tr></tfoot></table><footer><span>Mengetahui,<br />{signatureUrl && <img src={signatureUrl} alt="Tanda tangan kepala madrasah" className={styles.previewSignature} />}Kepala Sekolah/Madrasah{headmasterName && <><br /><b>{headmasterName}</b></>}</span><span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span></footer></article></section></>}
    <p className={styles.saved}>{saved ? "PROMES tersimpan dan disinkronkan ke Supabase." : "Dokumen tersimpan lokal hingga Supabase dikonfigurasi."}</p>
  </AppShell>;
}
