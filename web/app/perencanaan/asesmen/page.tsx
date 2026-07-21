"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { useSchoolAssets } from "@/lib/hooks/useSchoolAssets";
import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { UpgradeBlock } from "@/app/components/UpgradeBlock";
import styles from "./assessment.module.css";

type Objective = { id: string; code: string; description: string; semester: 1 | 2 };
type ProtaData = { meta?: { subject?: string; className?: string; year?: string }; objectives?: Objective[] };
type Criterion = { objectiveId: string; technique: string; minimum: number; descriptionCriterion: string };
type KktpData = { criteria?: Criterion[] };
type Question = { id: string; prompt: string; score: number };
type Assessment = { objectiveId: string; title: string; phase: string; technique: string; questions: Question[] };

function readStorage<T>(key: string): T { return storage.getItem<T>(key); }
function validObjectives(value: ProtaData["objectives"]): Objective[] { return Array.isArray(value) ? value.filter((item): item is Objective => Boolean(item?.id && item.code && item.description && (item.semester === 1 || item.semester === 2))) : []; }

export default function AssessmentPage() {
  const { logoUrl, signatureUrl, headmasterName } = useSchoolAssets();
  const gate = useSubscriptionGate();
  const [prota, setProta] = useState<ProtaData>({});
  const [kktp, setKktp] = useState<KktpData>({});
  const objectives = useMemo(() => validObjectives(prota.objectives), [prota.objectives]);
  const criteria = kktp.criteria ?? [];
  const [assessment, setAssessment] = useState<Assessment>({ objectiveId: "", title: "", phase: "Formatif", technique: "Tes tertulis", questions: [] });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProta(readStorage<ProtaData>("gurukbc-prota"));
    setKktp(readStorage<KktpData>("gurukbc-kktp"));
  }, []);

  const selectedObjective = objectives.find((item) => item.id === assessment.objectiveId);
  const criterion = criteria.find((item) => item.objectiveId === assessment.objectiveId);
  const totalScore = assessment.questions.reduce((total, item) => total + item.score, 0);
  const hasPrerequisites = objectives.length > 0 && Boolean(criterion);
  const update = <K extends keyof Assessment>(key: K, value: Assessment[K]) => { setAssessment((current) => ({ ...current, [key]: value })); setSaved(false); };
  const selectObjective = (objectiveId: string) => { const objective = objectives.find((item) => item.id === objectiveId); const linkedCriterion = criteria.find((item) => item.objectiveId === objectiveId); setAssessment((current) => ({ ...current, objectiveId, title: objective ? `Asesmen ${objective.code}` : current.title, technique: linkedCriterion?.technique ?? current.technique })); setSaved(false); };
  const addQuestion = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const prompt = String(data.get("prompt")).trim(); const score = Math.max(1, Number(data.get("score"))); if (!prompt) return; setAssessment((current) => ({ ...current, questions: [...current.questions, { id: crypto.randomUUID(), prompt, score }] })); setSaved(false); event.currentTarget.reset(); };
  const removeQuestion = (id: string) => { setAssessment((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== id) })); setSaved(false); };
  const saveAssessment = async () => { if (!hasPrerequisites || !assessment.title.trim() || assessment.questions.length === 0) return; const allowed = await gate.recordDocumentSave(); if (!allowed) return; const existing = readStorage<{ assessments?: Assessment[] }>("gurukbc-assessments"); const assessments = [...(existing.assessments ?? []).filter((item) => item.objectiveId !== assessment.objectiveId), assessment]; storage.setItem("gurukbc-assessments", { meta: prota.meta, assessments, updatedAt: new Date().toISOString() }); setSaved(true); };
  return <AppShell><PageHeader eyebrow="PERENCANAAN / ASESMEN" title="Instrumen Asesmen" description="Susun pertanyaan dan rubrik asesmen yang sesuai dengan KKTP." action={<div className={styles.actions}><button className={`button ${styles.secondary}`} onClick={() => window.print()} disabled={!hasPrerequisites}>Cetak / PDF</button><button className="button button-primary" onClick={saveAssessment} disabled={!hasPrerequisites || assessment.questions.length === 0}>Simpan Asesmen</button></div>} />
    <UpgradeBlock gate={gate} />
    {!hasPrerequisites ? <section className={`empty-state ${styles.notice}`}><h2>Data TP atau KKTP belum tersedia.</h2><p>Simpan PROTA dan KKTP terlebih dahulu untuk membuat instrumen asesmen yang terhubung.</p></section> : <section className={styles.layout}><div className={styles.editor}><section className="form-panel"><h2 className={styles.title}>Identitas asesmen</h2><div className="form-grid"><label className="full">Tujuan pembelajaran<select value={assessment.objectiveId} onChange={(event) => selectObjective(event.target.value)}>{objectives.map((item) => <option value={item.id} key={item.id}>{item.code} — {item.description}</option>)}</select></label><label className="full">Judul asesmen<input value={assessment.title} onChange={(event) => update("title", event.target.value)} /></label><label>Jenis asesmen<select value={assessment.phase} onChange={(event) => update("phase", event.target.value)}><option>Formatif</option><option>Sumatif</option><option>Diagnostik</option></select></label><label>Teknik asesmen<select value={assessment.technique} onChange={(event) => update("technique", event.target.value)}><option>Tes tertulis</option><option>Observasi</option><option>Unjuk kerja</option><option>Proyek</option><option>Portofolio</option></select></label></div></section>
      <form className={`form-panel ${styles.questionForm}`} onSubmit={addQuestion}><h2 className={styles.title}>Tambah butir instrumen</h2><div className="form-grid"><label className="full">Pertanyaan atau tugas<textarea name="prompt" rows={3} required placeholder="Tuliskan pertanyaan, instruksi tugas, atau indikator observasi" /></label><label>Bobot nilai<input name="score" type="number" min="1" defaultValue="10" required /></label></div><button className={`button ${styles.secondary}`}>Tambah butir</button></form>
      <section className={`panel ${styles.questions}`}><div className="panel-title"><div><h2>Butir asesmen</h2><p>{assessment.questions.length} butir · total {totalScore} poin</p></div></div>{assessment.questions.length === 0 ? <p className={styles.empty}>Tambahkan minimal satu butir untuk menyimpan asesmen.</p> : <ol>{assessment.questions.map((item, index) => <li key={item.id}><span>{index + 1}</span><div><p>{item.prompt}</p><small>{item.score} poin</small></div><button type="button" onClick={() => removeQuestion(item.id)}>Hapus</button></li>)}</ol>}</section></div>
      <section className={styles.previewWrap}><p className={styles.previewLabel}>PRATINJAU A4</p><article className={styles.preview}><header>{logoUrl && <img src={logoUrl} alt="Logo madrasah" className={styles.previewLogo} />}<p>INSTRUMEN ASESMEN {assessment.phase.toUpperCase()}</p><h2>{assessment.title || "ASESMEN"}</h2><span>Tahun Pelajaran {prota.meta?.year ?? "-"}</span></header><dl><div><dt>Mata Pelajaran</dt><dd>{prota.meta?.subject ?? "-"}</dd></div><div><dt>Kelas / Fase</dt><dd>{prota.meta?.className ?? "-"}</dd></div><div><dt>Tujuan Pembelajaran</dt><dd><b>{selectedObjective?.code}</b> — {selectedObjective?.description}</dd></div><div><dt>Teknik Asesmen</dt><dd>{assessment.technique}</dd></div></dl><section><h3>Petunjuk</h3><p>Kerjakan instrumen secara mandiri, jujur, dan bertanggung jawab.</p></section><ol className={styles.previewQuestions}>{assessment.questions.length === 0 ? <li>Tambahkan butir asesmen untuk melengkapi instrumen.</li> : assessment.questions.map((item) => <li key={item.id}>{item.prompt}<small>Skor: {item.score}</small></li>)}</ol><section><h3>Rubrik ketuntasan</h3><p>{criterion?.descriptionCriterion}</p><small>Teknik: {criterion?.technique} · Nilai minimum: {criterion?.minimum}</small></section><footer><span>Mengetahui,<br />{signatureUrl && <img src={signatureUrl} alt="Tanda tangan kepala madrasah" className={styles.previewSignature} />}Kepala Madrasah{headmasterName && <><br /><b>{headmasterName}</b></>}</span><span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span></footer></article></section></section>}
    <p className={styles.saved}>{saved ? "Asesmen tersimpan dan disinkronkan ke Supabase." : "Dokumen tersimpan lokal hingga Supabase dikonfigurasi."}</p>
  </AppShell>;
}
