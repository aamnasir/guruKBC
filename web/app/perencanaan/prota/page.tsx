"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { getCurriculumBank } from "@/lib/supabase/queries";
import { useSchoolAssets } from "@/lib/hooks/useSchoolAssets";
import { useSubscriptionGate } from "@/lib/hooks/useSubscriptionGate";
import { UpgradeBlock } from "@/app/components/UpgradeBlock";
import type { CurriculumTheme } from "@/lib/supabase/types";
import styles from "./prota.module.css";

type Objective = { id: string; code: string; description: string; semester: 1 | 2; hours: number };
type WeekAnalysis = { year?: { name?: string }; weeks?: { semester: 1 | 2; estimatedHours?: number }[] };
type ProtaData = { meta?: { subject?: string; classId?: string; year?: string }; objectives?: Objective[] };
type SubjectItem = { id: string; name: string; code: string };
type ClassItem = { id: string; name: string; phase: string };

function readProta(): ProtaData {
  return storage.getItem<ProtaData>("gurukbc-prota");
}

export default function ProtaPage() {
  const { logoUrl, signatureUrl, headmasterName } = useSchoolAssets();
  const gate = useSubscriptionGate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [meta, setMeta] = useState({ subject: "", classId: "", year: "2026/2027" });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [themes, setThemes] = useState<CurriculumTheme[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [bankSemester, setBankSemester] = useState<1 | 2>(1);
  const [bankHours, setBankHours] = useState(4);
  const [addedFromBank, setAddedFromBank] = useState<Set<string>>(new Set());

  useEffect(() => {
    const data = readProta();
    if (data.objectives?.length) {
      setObjectives(data.objectives);
      setMeta({ subject: data.meta?.subject ?? "", classId: data.meta?.classId ?? "", year: data.meta?.year ?? "2026/2027" });
    }
    const master = storage.getItem<Partial<{ subjects: SubjectItem[]; classes: ClassItem[] }>>("gurukbc-mapel-kelas");
    if (master) {
      setSubjects(master.subjects ?? []);
      setClasses(master.classes ?? []);
    }
    const year = storage.getItem<Partial<{ name: string }>>("gurukbc-academic-year");
    if (year?.name) setMeta((current) => (current.year ? current : { ...current, year: year.name! }));
  }, []);

  const selectedClass = classes.find((item) => item.id === meta.classId);
  const phase = selectedClass?.phase ?? "";

  useEffect(() => {
    if (!meta.subject || !phase) { setThemes([]); return; }
    let cancelled = false;
    setBankLoading(true);
    setSelectedThemeId("");
    setSelectedTopicId("");
    getCurriculumBank(meta.subject, phase).then(({ data }) => {
      if (cancelled) return;
      setThemes((data as CurriculumTheme[] | null) ?? []);
      setBankLoading(false);
    });
    return () => { cancelled = true; };
  }, [meta.subject, phase]);

  const selectedTheme = themes.find((item) => item.id === selectedThemeId);
  const selectedTopic = selectedTheme?.curriculum_topics?.find((item) => item.id === selectedTopicId);

  const [analysis] = useState<WeekAnalysis>({});
  const capacity = useMemo(() => ({
    one: analysis.weeks?.filter((week) => week.semester === 1).reduce((total, week) => total + (week.estimatedHours ?? 0), 0) ?? 0,
    two: analysis.weeks?.filter((week) => week.semester === 2).reduce((total, week) => total + (week.estimatedHours ?? 0), 0) ?? 0,
  }), [analysis]);
  const required = {
    one: objectives.filter((item) => item.semester === 1).reduce((total, item) => total + item.hours, 0),
    two: objectives.filter((item) => item.semester === 2).reduce((total, item) => total + item.hours, 0),
  };

  function addObjective(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const description = String(data.get("description")).trim();
    if (!description) return;
    setObjectives((items) => [...items, {
      id: crypto.randomUUID(),
      code: String(data.get("code")).trim() || `TP ${items.length + 1}`,
      description,
      semester: Number(data.get("semester")) as 1 | 2,
      hours: Math.max(1, Number(data.get("hours"))),
    }]);
    setSaved(false);
    setError("");
    event.currentTarget.reset();
  }

  function addFromBank(objectiveId: string, code: string | null, description: string) {
    setObjectives((items) => [...items, {
      id: crypto.randomUUID(),
      code: code || `TP ${items.length + 1}`,
      description,
      semester: bankSemester,
      hours: Math.max(1, bankHours),
    }]);
    setAddedFromBank((current) => new Set(current).add(objectiveId));
    setSaved(false);
    setError("");
  }

  function removeObjective(id: string) {
    setObjectives((items) => items.filter((item) => item.id !== id));
    setSaved(false);
  }

  const saveProta = async () => {
    if (!meta.subject.trim() || !meta.classId.trim() || objectives.length === 0) {
      setError("Lengkapi mata pelajaran, kelas, dan minimal satu tujuan pembelajaran.");
      return;
    }
    const allowed = await gate.recordDocumentSave();
    if (!allowed) { setError(""); return; }
    const enrichedMeta = { ...meta, className: selectedClass?.name ?? "", phase };
    storage.setItem("gurukbc-prota", { meta: enrichedMeta, objectives, updatedAt: new Date().toISOString() });
    setError("");
    setSaved(true);
  };

  const balance = (semester: 1 | 2) => {
    const data = semester === 1 ? { required: required.one, capacity: capacity.one } : { required: required.two, capacity: capacity.two };
    return data.capacity === 0
      ? "Simpan Analisis Pekan Efektif untuk melihat kapasitas JP."
      : data.required <= data.capacity
        ? `Alokasi aman: sisa ${data.capacity - data.required} JP.`
        : `Kelebihan ${data.required - data.capacity} JP dari kapasitas.`;
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="PERENCANAAN / PROTA"
        title="Program Tahunan (PROTA)"
        description="Susun distribusi tujuan pembelajaran dan jam pelajaran untuk satu tahun ajaran."
        action={<div className={styles.actions}>
          <button className={`button ${styles.secondary}`} onClick={() => window.print()}>Cetak / PDF</button>
          <button className="button button-primary" onClick={saveProta}>Simpan PROTA</button>
        </div>}
      />
      <section className={styles.layout}>
        <div className={styles.editor}>
          <section className="form-panel">
            <h2 className={styles.title}>Identitas perangkat</h2>
            {subjects.length === 0 || classes.length === 0 ? (
              <p className={styles.empty}>
                Mata pelajaran atau kelas belum diisi. Lengkapi dulu di{" "}
                <a href="/master-data/mata-pelajaran">Master Data &raquo; Mata Pelajaran &amp; Kelas</a>.
              </p>
            ) : (
              <div className="form-grid">
                <label>
                  Mata pelajaran
                  <select value={meta.subject} onChange={(event) => { setMeta({ ...meta, subject: event.target.value }); setSaved(false); }}>
                    <option value="">Pilih mata pelajaran</option>
                    {subjects.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </label>
                <label>
                  Kelas / fase
                  <select value={meta.classId} onChange={(event) => { setMeta({ ...meta, classId: event.target.value }); setSaved(false); }}>
                    <option value="">Pilih kelas</option>
                    {classes.map((item) => <option key={item.id} value={item.id}>{item.name}{item.phase ? ` (Fase ${item.phase})` : ""}</option>)}
                  </select>
                </label>
                <label className="full">
                  Tahun pelajaran
                  <input value={meta.year} onChange={(event) => { setMeta({ ...meta, year: event.target.value }); setSaved(false); }} />
                </label>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h2>Bank Tujuan Pembelajaran (KBC)</h2>
                <p>Pilih TP resmi sesuai tema dan topik, tidak perlu mengetik manual.</p>
              </div>
            </div>
            {!meta.subject || !phase ? (
              <p className={styles.empty}>Pilih mata pelajaran dan kelas di atas untuk melihat bank TP.</p>
            ) : bankLoading ? (
              <p className={styles.empty}>Memuat bank TP...</p>
            ) : themes.length === 0 ? (
              <p className={styles.empty}>Bank TP untuk {meta.subject} &middot; Fase {phase} belum diisi. Gunakan form tambah manual di bawah.</p>
            ) : (
              <>
                <div className="form-grid">
                  <label>
                    Tema
                    <select value={selectedThemeId} onChange={(event) => { setSelectedThemeId(event.target.value); setSelectedTopicId(""); }}>
                      <option value="">Pilih tema</option>
                      {themes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Topik
                    <select value={selectedTopicId} onChange={(event) => setSelectedTopicId(event.target.value)} disabled={!selectedTheme}>
                      <option value="">Pilih topik</option>
                      {selectedTheme?.curriculum_topics?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label>
                    Semester untuk TP terpilih
                    <select value={bankSemester} onChange={(event) => setBankSemester(Number(event.target.value) as 1 | 2)}>
                      <option value={1}>Semester 1</option>
                      <option value={2}>Semester 2</option>
                    </select>
                  </label>
                  <label>
                    Alokasi JP untuk TP terpilih
                    <input type="number" min={1} value={bankHours} onChange={(event) => setBankHours(Number(event.target.value))} />
                  </label>
                </div>
                {selectedTopic && (
                  <ul className={styles.bankList}>
                    {(selectedTopic.curriculum_objectives ?? []).length === 0 ? (
                      <li className={styles.bankEmpty}>Belum ada TP untuk topik ini.</li>
                    ) : selectedTopic.curriculum_objectives!.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>{item.code || "TP"}</strong>
                          <p>{item.description}</p>
                        </div>
                        <button
                          type="button"
                          className={`button ${styles.secondary}`}
                          disabled={addedFromBank.has(item.id)}
                          onClick={() => addFromBank(item.id, item.code, item.description)}
                        >
                          {addedFromBank.has(item.id) ? "Sudah ditambah" : "+ Tambah"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          <form className={`form-panel ${styles.objectiveForm}`} onSubmit={addObjective}>
            <h2 className={styles.title}>Tambah tujuan pembelajaran manual</h2>
            <div className="form-grid">
              <label>Kode TP<input name="code" placeholder="Contoh: TP 1" /></label>
              <label>Semester<select name="semester" defaultValue="1"><option value="1">Semester 1</option><option value="2">Semester 2</option></select></label>
              <label className="full">Tujuan pembelajaran<textarea name="description" rows={3} required placeholder="Masukkan rumusan tujuan pembelajaran" /></label>
              <label>Alokasi JP<input name="hours" type="number" min="1" defaultValue="4" required /></label>
            </div>
            <button className={`button ${styles.secondary}`}>Tambah TP</button>
          </form>

          <UpgradeBlock gate={gate} />

          <section className={`panel ${styles.allocation}`}>
            <div className="panel-title"><div><h2>Validasi alokasi JP</h2><p>Dibandingkan dengan Analisis Pekan Efektif.</p></div></div>
            <div><p><strong>Semester 1:</strong> {required.one} / {capacity.one || "-"} JP</p><small>{balance(1)}</small></div>
            <div><p><strong>Semester 2:</strong> {required.two} / {capacity.two || "-"} JP</p><small>{balance(2)}</small></div>
          </section>

          <section className={`panel ${styles.objectives}`}>
            <div className="panel-title"><div><h2>Daftar tujuan pembelajaran</h2><p>Hapus TP yang belum sesuai sebelum menyimpan dokumen.</p></div><strong>{objectives.length} TP</strong></div>
            {objectives.length === 0 ? <p className={styles.empty}>Belum ada tujuan pembelajaran.</p> : (
              <ol>
                {objectives.map((item) => (
                  <li key={item.id}>
                    <div><strong>{item.code}</strong><span>Semester {item.semester} &middot; {item.hours} JP</span><p>{item.description}</p></div>
                    <button type="button" onClick={() => removeObjective(item.id)} aria-label={`Hapus ${item.code}`}>Hapus</button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <section className={styles.previewWrap}>
          <p className={styles.previewLabel}>PRATINJAU A4</p>
          <article className={styles.preview}>
            <header>
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo madrasah" className={styles.previewLogo} />
              )}
              <p>PROGRAM TAHUNAN</p>
              <h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2>
              <span>Tahun Pelajaran {meta.year}</span>
            </header>
            <dl>
              <div><dt>Satuan Pendidikan</dt><dd>Madrasah</dd></div>
              <div><dt>Mata Pelajaran</dt><dd>{meta.subject || "-"}</dd></div>
              <div><dt>Kelas / Fase</dt><dd>{selectedClass ? `${selectedClass.name}${selectedClass.phase ? ` (Fase ${selectedClass.phase})` : ""}` : "-"}</dd></div>
            </dl>
            <table>
              <thead><tr><th>No.</th><th>Tujuan Pembelajaran</th><th>Semester</th><th>Alokasi JP</th></tr></thead>
              <tbody>
                {objectives.length === 0 ? (
                  <tr><td colSpan={4} className={styles.placeholder}>Tambahkan tujuan pembelajaran untuk membuat PROTA.</td></tr>
                ) : objectives.map((item, index) => (
                  <tr key={item.id}><td>{index + 1}</td><td><b>{item.code}</b><span>{item.description}</span></td><td>{item.semester}</td><td>{item.hours}</td></tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={3}>Jumlah JP</td><td>{required.one + required.two}</td></tr></tfoot>
            </table>
            <footer>
              <span>
                Mengetahui,<br />
                {signatureUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={signatureUrl} alt="Tanda tangan kepala madrasah" className={styles.previewSignature} />
                )}
                Kepala Madrasah
                {headmasterName && <><br /><b>{headmasterName}</b></>}
              </span>
              <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span>
            </footer>
          </article>
        </section>
      </section>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <p className={styles.saved}>{saved ? "PROTA tersimpan dan disinkronkan ke Supabase." : "Dokumen tersimpan lokal hingga Supabase dikonfigurasi."}</p>
    </AppShell>
  );
}
