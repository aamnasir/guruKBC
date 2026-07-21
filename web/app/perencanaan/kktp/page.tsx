"use client";

import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { useSchoolAssets } from "@/lib/hooks/useSchoolAssets";
import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { UpgradeBlock } from "@/app/components/UpgradeBlock";
import styles from "./kktp.module.css";

type Objective = { id: string; code: string; description: string; semester: 1 | 2; hours: number };
type ProtaData = { meta?: { subject?: string; className?: string; year?: string }; objectives?: Objective[] };
type Allocation = { weekNumber: number; semester: 1 | 2; objectiveId: string; code: string; description: string; hours: number };
type PromesData = { allocations?: Allocation[] };
type Criterion = { objectiveId: string; code: string; description: string; semester: 1 | 2; weeks: string; technique: string; minimum: number; descriptionCriterion: string };

function readStorage<T>(key: string): T { return storage.getItem<T>(key); }
function validObjectives(value: ProtaData["objectives"]): Objective[] { return Array.isArray(value) ? value.filter((item): item is Objective => Boolean(item?.id && item.code && item.description && (item.semester === 1 || item.semester === 2))) : []; }
function validAllocations(value: PromesData["allocations"]): Allocation[] { return Array.isArray(value) ? value.filter((item): item is Allocation => Boolean(item?.objectiveId && Number.isFinite(item.weekNumber) && (item.semester === 1 || item.semester === 2))) : []; }
function createCriteria(objectives: Objective[], allocations: Allocation[]): Criterion[] { return objectives.map((objective) => { const weeks = allocations.filter((item) => item.objectiveId === objective.id).map((item) => item.weekNumber).sort((a, b) => a - b); return { objectiveId: objective.id, code: objective.code, description: objective.description, semester: objective.semester, weeks: weeks.length ? `Pekan ${weeks.join(", ")}` : "Belum terjadwal", technique: "Tes tertulis", minimum: 75, descriptionCriterion: "Peserta didik mampu mencapai tujuan pembelajaran dengan baik." }; }); }
function savedCriteria(value: unknown): Criterion[] { return Array.isArray(value) ? value.filter((item): item is Criterion => Boolean(item && typeof item === "object" && "objectiveId" in item && "minimum" in item)) : []; }

export default function KktpPage() {
  const { logoUrl, signatureUrl, headmasterName } = useSchoolAssets();
  const gate = useSubscriptionGate();
  const [prota, setProta] = useState<ProtaData>({});
  const [promes, setPromes] = useState<PromesData>({});
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProta(readStorage<ProtaData>("gurukbc-prota"));
    setPromes(readStorage<PromesData>("gurukbc-promes"));
  }, []);

  const objectives = useMemo(() => validObjectives(prota.objectives), [prota.objectives]);
  const allocations = useMemo(() => validAllocations(promes.allocations), [promes.allocations]);

  useEffect(() => {
    const data = readStorage<{ criteria?: Criterion[] }>("gurukbc-kktp");
    const stored = savedCriteria(data.criteria);
    if (stored.length) setCriteria(stored);
    else setCriteria(createCriteria(validObjectives(prota.objectives ?? []), validAllocations(promes.allocations ?? [])));
  }, [prota.objectives, promes.allocations]);

  const hasPrerequisites = objectives.length > 0 && allocations.length > 0;
  const updateCriterion = (id: string, key: "technique" | "minimum" | "descriptionCriterion", value: string | number) => { setCriteria((items) => items.map((item) => item.objectiveId === id ? { ...item, [key]: value } : item)); setSaved(false); };
  const saveKktp = async () => { if (!hasPrerequisites || criteria.some((item) => item.minimum < 0 || item.minimum > 100 || !item.descriptionCriterion.trim())) return; const allowed = await gate.recordDocumentSave(); if (!allowed) return; storage.setItem("gurukbc-kktp", { meta: prota.meta, criteria, updatedAt: new Date().toISOString() }); setSaved(true); };
  return <AppShell><PageHeader eyebrow="PERENCANAAN / KKTP" title="Kriteria Ketercapaian Tujuan Pembelajaran" description="Bangun KKTP dari tujuan pembelajaran PROTA dan jadwal PROMES." action={<div className={styles.actions}><button className={`button ${styles.secondary}`} onClick={() => window.print()} disabled={!hasPrerequisites}>Cetak / PDF</button><button className="button button-primary" onClick={saveKktp} disabled={!hasPrerequisites}>Simpan KKTP</button></div>} />
    <UpgradeBlock gate={gate} />
    {!hasPrerequisites ? <section className={`empty-state ${styles.notice}`}><h2>PROTA atau PROMES belum tersedia.</h2><p>Simpan PROTA dan PROMES terlebih dahulu agar KKTP dapat dibuat otomatis dari tujuan pembelajaran yang sudah terjadwal.</p></section> : <><section className={styles.summary}><article><span>TUJUAN PEMBELAJARAN</span><strong>{criteria.length}</strong><small>Kriteria dibuat otomatis</small></article><article><span>AMBANG BAWAAN</span><strong>75</strong><small>Dapat disesuaikan setiap TP</small></article><article><span>SUMBER DATA</span><strong>PROMES</strong><small>Jadwal pekan pembelajaran</small></article></section>
      <section className={`panel ${styles.editor}`}><div className="panel-title"><div><h2>Atur kriteria ketercapaian</h2><p>Sesuaikan teknik asesmen, nilai minimum, dan deskripsi indikator setiap tujuan pembelajaran.</p></div></div><div className={styles.tableWrap}><table><thead><tr><th>TP & Jadwal</th><th>Teknik asesmen</th><th>Nilai minimum</th><th>Kriteria ketercapaian</th></tr></thead><tbody>{criteria.map((item) => <tr key={item.objectiveId}><td><b>{item.code}</b><span>{item.description}</span><small>Semester {item.semester} · {item.weeks}</small></td><td><select value={item.technique} onChange={(event) => updateCriterion(item.objectiveId, "technique", event.target.value)}><option>Tes tertulis</option><option>Observasi</option><option>Unjuk kerja</option><option>Proyek</option><option>Portofolio</option></select></td><td><input aria-label={`Nilai minimum ${item.code}`} type="number" min="0" max="100" value={item.minimum} onChange={(event) => updateCriterion(item.objectiveId, "minimum", Math.min(100, Math.max(0, Number(event.target.value))))} /></td><td><textarea aria-label={`Kriteria ${item.code}`} rows={3} value={item.descriptionCriterion} onChange={(event) => updateCriterion(item.objectiveId, "descriptionCriterion", event.target.value)} /></td></tr>)}</tbody></table></div></section>
      <section className={styles.previewWrap}><p className={styles.previewLabel}>PRATINJAU A4</p><article className={styles.preview}><header>{logoUrl && <img src={logoUrl} alt="Logo madrasah" className={styles.previewLogo} />}<p>KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN</p><h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2><span>Tahun Pelajaran {prota.meta?.year ?? "-"}</span></header><dl><div><dt>Mata Pelajaran</dt><dd>{prota.meta?.subject ?? "-"}</dd></div><div><dt>Kelas / Fase</dt><dd>{prota.meta?.className ?? "-"}</dd></div></dl><table><thead><tr><th>No.</th><th>Tujuan Pembelajaran</th><th>Teknik</th><th>Kriteria Ketercapaian</th><th>Nilai Min.</th></tr></thead><tbody>{criteria.map((item, index) => <tr key={item.objectiveId}><td>{index + 1}</td><td><b>{item.code}</b><span>{item.description}</span></td><td>{item.technique}</td><td>{item.descriptionCriterion}</td><td>{item.minimum}</td></tr>)}</tbody></table><footer><span>Mengetahui,<br />{signatureUrl && <img src={signatureUrl} alt="Tanda tangan kepala madrasah" className={styles.previewSignature} />}Kepala Madrasah{headmasterName && <><br /><b>{headmasterName}</b></>}</span><span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span></footer></article></section></>}
    <p className={styles.saved}>{saved ? "KKTP tersimpan dan disinkronkan ke Supabase." : "Dokumen tersimpan lokal hingga Supabase dikonfigurasi."}</p>
  </AppShell>;
}
