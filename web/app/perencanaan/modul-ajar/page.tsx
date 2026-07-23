"use client";

import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { useSchoolAssets } from "@/lib/hooks/useSchoolAssets";
import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { UpgradeBlock } from "@/app/components/UpgradeBlock";
import styles from "./module.module.css";

type Objective = { id: string; code: string; description: string; semester: 1 | 2; hours: number };
type ProtaData = { meta?: { subject?: string; className?: string; year?: string }; objectives?: Objective[] };
type Criterion = { objectiveId: string; technique: string; minimum: number; descriptionCriterion: string };
type KktpData = { criteria?: Criterion[] };
type ModuleData = { objectiveId: string; title: string; meetings: number; model: string; initialCompetency: string; meaningfulUnderstanding: string; triggerQuestion: string; learningActivities: string; assessment: string };

function readStorage<T>(key: string): T { return storage.getItem<T>(key); }
function validObjectives(value: ProtaData["objectives"]): Objective[] { return Array.isArray(value) ? value.filter((item): item is Objective => Boolean(item?.id && item.code && item.description && (item.semester === 1 || item.semester === 2))) : []; }

export default function TeachingModulePage() {
  const { logoUrl, signatureUrl, headmasterName } = useSchoolAssets();
  const gate = useSubscriptionGate();
  const [prota, setProta] = useState<ProtaData>({});
  const [kktp, setKktp] = useState<KktpData>({});
  const [module, setModule] = useState<ModuleData>({ objectiveId: "", title: "", meetings: 1, model: "Pembelajaran Berbasis Proyek", initialCompetency: "", meaningfulUnderstanding: "", triggerQuestion: "", learningActivities: "", assessment: "" });
  const [saved, setSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiDrafted, setAiDrafted] = useState(false);

  useEffect(() => {
    setProta(readStorage<ProtaData>("gurukbc-prota"));
    setKktp(readStorage<KktpData>("gurukbc-kktp"));
  }, []);

  const objectives = useMemo(() => validObjectives(prota.objectives), [prota.objectives]);
  const selectedObjective = objectives.find((item) => item.id === module.objectiveId);
  const criterion = kktp.criteria?.find((item) => item.objectiveId === module.objectiveId);
  const hasPrerequisites = objectives.length > 0 && Boolean(criterion);
  const update = <K extends keyof ModuleData>(key: K, value: ModuleData[K]) => { setModule((current) => ({ ...current, [key]: value })); setSaved(false); };
  const selectObjective = (objectiveId: string) => { const objective = objectives.find((item) => item.id === objectiveId); setModule((current) => ({ ...current, objectiveId, title: objective ? `Modul Ajar ${objective.code}` : current.title, meaningfulUnderstanding: objective ? `Peserta didik memahami dan mampu menerapkan: ${objective.description}` : current.meaningfulUnderstanding })); setSaved(false); };
  const saveModule = async () => {
    if (!hasPrerequisites || !module.title.trim() || !module.learningActivities.trim()) return;
    const allowed = await gate.recordDocumentSave();
    if (!allowed) return;
    const existing = readStorage<{ modules?: ModuleData[] }>("gurukbc-teaching-modules");
    const modules = [...(existing.modules ?? []).filter((item) => item.objectiveId !== module.objectiveId), module];
    storage.setItem("gurukbc-teaching-modules", { meta: prota.meta, modules, updatedAt: new Date().toISOString() });
    setSaved(true);
  };
  const generateDraft = async () => {
    if (!selectedObjective) return;
    setAiLoading(true);
    setAiError("");
    setAiDrafted(false);
    try {
      const response = await fetch("/api/generate-modul-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: prota.meta?.subject,
          className: prota.meta?.className,
          objectiveCode: selectedObjective.code,
          objectiveDescription: selectedObjective.description,
          model: module.model,
          meetings: module.meetings,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setAiError(data.error ?? "Gagal membuat draf."); return; }
      setModule((current) => ({
        ...current,
        initialCompetency: data.initialCompetency || current.initialCompetency,
        meaningfulUnderstanding: data.meaningfulUnderstanding || current.meaningfulUnderstanding,
        triggerQuestion: data.triggerQuestion || current.triggerQuestion,
        learningActivities: data.learningActivities || current.learningActivities,
      }));
      setAiDrafted(true);
      setSaved(false);
    } catch {
      setAiError("Tidak dapat terhubung ke layanan AI. Periksa koneksi internet Anda.");
    } finally {
      setAiLoading(false);
    }
  };
  return <AppShell><PageHeader eyebrow="PERENCANAAN / MODUL AJAR KBC" title="Modul Ajar Deep Learning KBC" description="Rangkai modul ajar dari tujuan pembelajaran, jadwal PROMES, dan KKTP." action={<div className={styles.actions}><button className={`button ${styles.secondary}`} onClick={() => window.print()} disabled={!hasPrerequisites}>Cetak / PDF</button><button className="button button-primary" onClick={saveModule} disabled={!hasPrerequisites}>Simpan Modul</button></div>} />
    <UpgradeBlock gate={gate} />
    {!hasPrerequisites ? <section className={`empty-state ${styles.notice}`}><h2>Data TP atau KKTP belum tersedia.</h2><p>Simpan PROTA, PROMES, dan KKTP terlebih dahulu untuk membuat Modul Ajar yang terhubung.</p></section> : <section className={styles.layout}><div className={styles.editor}><section className="form-panel"><h2 className={styles.title}>Identitas modul</h2><div className="form-grid"><label className="full">Tujuan pembelajaran<select value={module.objectiveId} onChange={(event) => selectObjective(event.target.value)}>{objectives.map((item) => <option value={item.id} key={item.id}>{item.code} — {item.description}</option>)}</select></label><label className="full">Judul modul<input value={module.title} onChange={(event) => update("title", event.target.value)} /></label><label>Jumlah pertemuan<input type="number" min="1" max="24" value={module.meetings} onChange={(event) => update("meetings", Math.max(1, Number(event.target.value)))} /></label><label>Model pembelajaran<select value={module.model} onChange={(event) => update("model", event.target.value)}><option>Pembelajaran Berbasis Proyek</option><option>Pembelajaran Berbasis Masalah</option><option>Inkuiri Terbimbing</option><option>Kooperatif</option></select></label></div></section>
      <section className="form-panel"><div className={styles.panelHeadRow}><h2 className={styles.title}>Desain pembelajaran bermakna</h2><button type="button" className={`button ${styles.secondary}`} onClick={generateDraft} disabled={!selectedObjective || aiLoading}>{aiLoading ? "Membuat draf..." : "✨ Buatkan draf dengan AI"}</button></div>{aiError && <p className={styles.aiError} role="alert">{aiError}</p>}{aiDrafted && <p className={styles.aiNotice}>Draf dibuat AI berdasarkan tujuan pembelajaran terpilih — baca dan sesuaikan sebelum disimpan.</p>}<div className="form-grid"><label className="full">Kompetensi awal<textarea rows={3} value={module.initialCompetency} onChange={(event) => update("initialCompetency", event.target.value)} /></label><label className="full">Pemahaman bermakna<textarea rows={3} value={module.meaningfulUnderstanding} onChange={(event) => update("meaningfulUnderstanding", event.target.value)} /></label><label className="full">Pertanyaan pemantik<textarea rows={2} value={module.triggerQuestion} onChange={(event) => update("triggerQuestion", event.target.value)} /></label><label className="full">Langkah kegiatan pembelajaran<textarea rows={6} value={module.learningActivities} onChange={(event) => update("learningActivities", event.target.value)} /></label><label className="full">Asesmen<textarea rows={3} value={module.assessment} onChange={(event) => update("assessment", event.target.value)} /></label></div></section></div>
      <section className={styles.previewWrap}><p className={styles.previewLabel}>PRATINJAU A4</p><article className={styles.preview}><header>{logoUrl && <img src={logoUrl} alt="Logo madrasah" className={styles.previewLogo} />}<p>MODUL AJAR</p><h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2><span>Tahun Pelajaran {prota.meta?.year ?? "-"}</span></header><dl><div><dt>Mata Pelajaran</dt><dd>{prota.meta?.subject ?? "-"}</dd></div><div><dt>Kelas / Fase</dt><dd>{prota.meta?.className ?? "-"}</dd></div><div><dt>Alokasi Waktu</dt><dd>{module.meetings} pertemuan</dd></div><div><dt>Model Pembelajaran</dt><dd>{module.model}</dd></div></dl><section><h3>Tujuan Pembelajaran</h3><p><b>{selectedObjective?.code}</b> — {selectedObjective?.description}</p></section><section><h3>Kompetensi Awal</h3><p>{module.initialCompetency}</p></section><section><h3>Pemahaman Bermakna</h3><p>{module.meaningfulUnderstanding}</p></section><section><h3>Pertanyaan Pemantik</h3><p>{module.triggerQuestion}</p></section><section><h3>Kegiatan Pembelajaran</h3><p className={styles.preline}>{module.learningActivities}</p></section><section><h3>Asesmen</h3><p>{module.assessment}</p><small>{criterion?.technique} · Nilai minimum {criterion?.minimum}</small></section><footer><span>Mengetahui,<br />{signatureUrl && <img src={signatureUrl} alt="Tanda tangan kepala madrasah" className={styles.previewSignature} />}Kepala Sekolah/Madrasah{headmasterName && <><br /><b>{headmasterName}</b></>}</span><span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span></footer></article></section></section>}
    <p className={styles.saved}>{saved ? "Modul Ajar tersimpan dan disinkronkan ke Supabase." : "Dokumen tersimpan lokal hingga Supabase dikonfigurasi."}</p>
  </AppShell>;
}
