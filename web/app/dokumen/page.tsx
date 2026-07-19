"use client";
import { useMemo, useState, useEffect } from "react";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { useAuth } from "@/lib/supabase/AuthContext";
import { createGeneratedDocument, getGeneratedDocuments } from "@/lib/supabase/queries";
import styles from "./documents.module.css";

type Stored = Record<string, unknown>;
type Source = { id: string; key: string; title: string; type: string; data: Stored; updatedAt: string; summary: string };
type ArchiveEntry = { id: string; sourceId: string; version: number; archivedAt: string; data: Stored; label?: string };
const archiveKey = "gurukbc-document-archive";

function count(value: unknown): number { return Array.isArray(value) ? value.length : 0; }
function formatDate(value: string): string { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Belum disimpan"; }

async function sourceDocuments(): Promise<Source[]> {
  const [prota, promes, kktp, modules, assessments] = await Promise.all([
    storage.getItem<Stored>("gurukbc-prota"),
    storage.getItem<Stored>("gurukbc-promes"),
    storage.getItem<Stored>("gurukbc-kktp"),
    storage.getItem<Stored>("gurukbc-teaching-modules"),
    storage.getItem<Stored>("gurukbc-assessments"),
  ]);
  return [
    { id: "prota", key: "gurukbc-prota", title: "Program Tahunan (PROTA)", type: "PROTA", data: prota, updatedAt: String(prota.updatedAt ?? prota.createdAt ?? ""), summary: `${count(prota.objectives)} tujuan pembelajaran` },
    { id: "promes", key: "gurukbc-promes", title: "Program Semester (PROMES)", type: "PROMES", data: promes, updatedAt: String(promes.updatedAt ?? promes.createdAt ?? ""), summary: `${count(promes.allocations)} distribusi TP` },
    { id: "kktp", key: "gurukbc-kktp", title: "KKTP", type: "KKTP", data: kktp, updatedAt: String(kktp.updatedAt ?? ""), summary: `${count(kktp.criteria)} kriteria ketercapaian` },
    { id: "module", key: "gurukbc-teaching-modules", title: "Modul Ajar KBC", type: "MODUL", data: modules, updatedAt: String(modules.updatedAt ?? ""), summary: `${count(modules.modules)} modul ajar` },
    { id: "assessment", key: "gurukbc-assessments", title: "Instrumen Asesmen", type: "ASESMEN", data: assessments, updatedAt: String(assessments.updatedAt ?? ""), summary: `${count(assessments.assessments)} instrumen asesmen` },
  ].filter((item) => Object.keys(item.data).length > 0);
}

function buildProtaPreview(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const objectives = (data as { objectives?: Array<{ code?: string; description?: string; semester?: 1 | 2; hours?: number }> }).objectives ?? [];
  const totalHours = objectives.reduce((total, item) => total + (item.hours ?? 0), 0);
  return (
    <article className={styles.preview}>
      <header>
        <p>PROGRAM TAHUNAN</p>
        <h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2>
        <span>Tahun Pelajaran {meta.year ?? "-"}</span>
      </header>
      <dl>
        <div><dt>Satuan Pendidikan</dt><dd>Madrasah</dd></div>
        <div><dt>Mata Pelajaran</dt><dd>{meta.subject ?? "-"}</dd></div>
        <div><dt>Kelas / Fase</dt><dd>{meta.grade ?? "-"}</dd></div>
      </dl>
      <table>
        <thead>
          <tr><th>No.</th><th>Tujuan Pembelajaran</th><th>Semester</th><th>Alokasi JP</th></tr>
        </thead>
        <tbody>
          {objectives.length === 0 ? <tr><td colSpan={4} className={styles.placeholder}>Belum ada tujuan pembelajaran.</td></tr> : objectives.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td><b>{item.code}</b><span>{item.description}</span></td>
              <td>{item.semester}</td>
              <td>{item.hours}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={3}>Jumlah JP</td><td>{totalHours}</td></tr>
        </tfoot>
      </table>
      <footer>
        <span>Mengetahui,<br />Kepala Madrasah</span>
        <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span>
      </footer>
    </article>
  );
}

function buildPromesPreview(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const allocations = (data as { allocations?: Array<{ weekNumber?: number; semester?: 1 | 2; code?: string; description?: string; hours?: number }> }).allocations ?? [];
  const totalHours = allocations.reduce((total, item) => total + (item.hours ?? 0), 0);
  return (
    <article className={styles.preview}>
      <header>
        <p>PROGRAM SEMESTER</p>
        <h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2>
        <span>Tahun Pelajaran {meta.year ?? "-"}</span>
      </header>
      <dl>
        <div><dt>Mata Pelajaran</dt><dd>{meta.subject ?? "-"}</dd></div>
        <div><dt>Kelas / Fase</dt><dd>{meta.grade ?? "-"}</dd></div>
      </dl>
      <table>
        <thead>
          <tr><th>Semester</th><th>Pekan</th><th>Tujuan Pembelajaran</th><th>JP</th></tr>
        </thead>
        <tbody>
          {allocations.length === 0 ? <tr><td colSpan={4} className={styles.placeholder}>Belum ada alokasi.</td></tr> : allocations.map((item, index) => (
            <tr key={index}>
              <td>{item.semester}</td>
              <td>{item.weekNumber}</td>
              <td><b>{item.code}</b><span>{item.description}</span></td>
              <td>{item.hours}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={3}>Jumlah JP</td><td>{totalHours}</td></tr>
        </tfoot>
      </table>
      <footer>
        <span>Mengetahui,<br />Kepala Madrasah</span>
        <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span>
      </footer>
    </article>
  );
}

function buildKktpPreview(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const criteria = (data as { criteria?: Array<{ code?: string; description?: string; technique?: string; minimum?: number; descriptionCriterion?: string }> }).criteria ?? [];
  return (
    <article className={styles.preview}>
      <header>
        <p>KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN</p>
        <h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2>
        <span>Tahun Pelajaran {meta.year ?? "-"}</span>
      </header>
      <dl>
        <div><dt>Mata Pelajaran</dt><dd>{meta.subject ?? "-"}</dd></div>
        <div><dt>Kelas / Fase</dt><dd>{meta.grade ?? "-"}</dd></div>
      </dl>
      <table>
        <thead>
          <tr><th>No.</th><th>Tujuan Pembelajaran</th><th>Teknik</th><th>Kriteria Ketercapaian</th><th>Nilai Min.</th></tr>
        </thead>
        <tbody>
          {criteria.length === 0 ? <tr><td colSpan={5} className={styles.placeholder}>Belum ada kriteria.</td></tr> : criteria.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td><b>{item.code}</b><span>{item.description}</span></td>
              <td>{item.technique}</td>
              <td>{item.descriptionCriterion}</td>
              <td>{item.minimum}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <span>Mengetahui,<br />Kepala Madrasah</span>
        <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span>
      </footer>
    </article>
  );
}

function buildModulePreview(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const modules = (data as { modules?: Array<{ title?: string; meetings?: number; model?: string; initialCompetency?: string; meaningfulUnderstanding?: string; triggerQuestion?: string; learningActivities?: string; assessment?: string; objectiveId?: string }> }).modules ?? [];
  const mod = modules[0];
  return (
    <article className={styles.preview}>
      <header>
        <p>MODUL AJAR</p>
        <h2>DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)</h2>
        <span>Tahun Pelajaran {meta.year ?? "-"}</span>
      </header>
      <dl>
        <div><dt>Mata Pelajaran</dt><dd>{meta.subject ?? "-"}</dd></div>
        <div><dt>Kelas / Fase</dt><dd>{meta.grade ?? "-"}</dd></div>
        <div><dt>Alokasi Waktu</dt><dd>{mod?.meetings ?? 0} pertemuan</dd></div>
        <div><dt>Model Pembelajaran</dt><dd>{mod?.model ?? "-"}</dd></div>
      </dl>
      {mod ? (
        <>
          <section><h3>Tujuan Pembelajaran</h3><p>{mod.title}</p></section>
          <section><h3>Kompetensi Awal</h3><p>{mod.initialCompetency}</p></section>
          <section><h3>Pemahaman Bermakna</h3><p>{mod.meaningfulUnderstanding}</p></section>
          <section><h3>Pertanyaan Pemantik</h3><p>{mod.triggerQuestion}</p></section>
          <section><h3>Kegiatan Pembelajaran</h3><p className={styles.preline}>{mod.learningActivities}</p></section>
          <section><h3>Asesmen</h3><p>{mod.assessment}</p></section>
        </>
      ) : <p className={styles.placeholder}>Belum ada modul ajar.</p>}
      <footer>
        <span>Mengetahui,<br />Kepala Madrasah</span>
        <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span>
      </footer>
    </article>
  );
}

function buildAssessmentPreview(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const assessments = (data as { assessments?: Array<{ title?: string; phase?: string; technique?: string; objectiveId?: string; questions?: Array<{ prompt?: string; score?: number }> }> }).assessments ?? [];
  const assessment = assessments[0];
  return (
    <article className={styles.preview}>
      <header>
        <p>INSTRUMEN ASESMEN {assessment?.phase?.toUpperCase() ?? "FORMATIF"}</p>
        <h2>{assessment?.title ?? "ASESMEN"}</h2>
        <span>Tahun Pelajaran {meta.year ?? "-"}</span>
      </header>
      <dl>
        <div><dt>Mata Pelajaran</dt><dd>{meta.subject ?? "-"}</dd></div>
        <div><dt>Kelas / Fase</dt><dd>{meta.grade ?? "-"}</dd></div>
        <div><dt>Teknik Asesmen</dt><dd>{assessment?.technique ?? "-"}</dd></div>
      </dl>
      {assessment?.questions?.length ? (
        <ol className={styles.previewQuestions}>
          {assessment.questions.map((item, index) => (
            <li key={index}>{item.prompt}<small>Skor: {item.score}</small></li>
          ))}
        </ol>
      ) : <p className={styles.placeholder}>Belum ada butir asesmen.</p>}
      <footer>
        <span>Mengetahui,<br />Kepala Madrasah</span>
        <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}<br />Guru Mata Pelajaran</span>
      </footer>
    </article>
  );
}

function buildProtaDocx(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const objectives = (data as { objectives?: Array<{ code?: string; description?: string; semester?: 1 | 2; hours?: number }> }).objectives ?? [];
  const children = [
    new Paragraph({ text: "PROGRAM TAHUNAN", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }),
    new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ text: "Daftar Tujuan Pembelajaran", heading: HeadingLevel.HEADING_2 }),
  ];
  objectives.forEach((item, index) => {
    children.push(new Paragraph({ text: `${index + 1}. ${item.code} - ${item.description} (Semester ${item.semester}, ${item.hours} JP)`, bullet: { level: 0 } }));
  });
  return new Document({ sections: [{ children }] });
}

function buildPromesDocx(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const allocations = (data as { allocations?: Array<{ weekNumber?: number; semester?: 1 | 2; code?: string; description?: string; hours?: number }> }).allocations ?? [];
  const children = [
    new Paragraph({ text: "PROGRAM SEMESTER", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }),
    new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ text: "Distribusi Tujuan Pembelajaran", heading: HeadingLevel.HEADING_2 }),
  ];
  allocations.forEach((item, index) => {
    children.push(new Paragraph({ text: `${index + 1}. Pekan ${item.weekNumber} (Semester ${item.semester}): ${item.code} - ${item.description} (${item.hours} JP)`, bullet: { level: 0 } }));
  });
  return new Document({ sections: [{ children }] });
}

function buildKktpDocx(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const criteria = (data as { criteria?: Array<{ code?: string; description?: string; technique?: string; minimum?: number; descriptionCriterion?: string }> }).criteria ?? [];
  const children = [
    new Paragraph({ text: "KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }),
    new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ text: "Daftar Kriteria Ketercapaian", heading: HeadingLevel.HEADING_2 }),
  ];
  criteria.forEach((item, index) => {
    children.push(new Paragraph({ text: `${index + 1}. ${item.code} - ${item.description}`, bullet: { level: 0 } }));
    children.push(new Paragraph({ text: `Teknik: ${item.technique} | Nilai Minimum: ${item.minimum}`, bullet: { level: 1 } }));
    children.push(new Paragraph({ text: `Kriteria: ${item.descriptionCriterion}`, bullet: { level: 1 } }));
  });
  return new Document({ sections: [{ children }] });
}

function buildModuleDocx(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const modules = (data as { modules?: Array<{ title?: string; meetings?: number; model?: string; initialCompetency?: string; meaningfulUnderstanding?: string; triggerQuestion?: string; learningActivities?: string; assessment?: string }> }).modules ?? [];
  const mod = modules[0];
  const children = [
    new Paragraph({ text: "MODUL AJAR", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }),
    new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
  ];
  if (mod) {
    children.push(new Paragraph({ text: mod.title ?? "Modul Ajar", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: `Alokasi Waktu: ${mod.meetings} pertemuan` }));
    children.push(new Paragraph({ text: `Model Pembelajaran: ${mod.model}` }));
    children.push(new Paragraph({ text: "", spacing: { after: 100 } }));
    children.push(new Paragraph({ text: "Kompetensi Awal", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: mod.initialCompetency ?? "-" }));
    children.push(new Paragraph({ text: "Pemahaman Bermakna", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: mod.meaningfulUnderstanding ?? "-" }));
    children.push(new Paragraph({ text: "Pertanyaan Pemantik", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: mod.triggerQuestion ?? "-" }));
    children.push(new Paragraph({ text: "Kegiatan Pembelajaran", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: mod.learningActivities ?? "-" }));
    children.push(new Paragraph({ text: "Asesmen", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: mod.assessment ?? "-" }));
  }
  return new Document({ sections: [{ children }] });
}

function buildAssessmentDocx(data: Stored) {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const assessments = (data as { assessments?: Array<{ title?: string; phase?: string; technique?: string; questions?: Array<{ prompt?: string; score?: number }> }> }).assessments ?? [];
  const assessment = assessments[0];
  const children = [
    new Paragraph({ text: `INSTRUMEN ASESMEN ${assessment?.phase?.toUpperCase() ?? "FORMATIF"}`, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: assessment?.title ?? "ASESMEN", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }),
    new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }),
    new Paragraph({ children: [new TextRun("Teknik Asesmen: "), new TextRun(assessment?.technique ?? "-")] }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({ text: "Butir Asesmen", heading: HeadingLevel.HEADING_2 }),
  ];
  assessment?.questions?.forEach((item, index) => {
    children.push(new Paragraph({ text: `${index + 1}. ${item.prompt} (Skor: ${item.score})`, bullet: { level: 0 } }));
  });
  return new Document({ sections: [{ children }] });
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [archive, setArchive] = useState<ArchiveEntry[]>([]);
  const [selected, setSelected] = useState<Source | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveEntry | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const totalVersions = useMemo(() => archive.length, [archive.length]);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const [docs, archived] = await Promise.all([
        sourceDocuments(),
        Promise.resolve(storage.getItem<{ entries?: ArchiveEntry[] }>(archiveKey)),
      ]);
      setSources(docs);
      setSelected(docs[0] ?? null);
      setArchive(archived?.entries ?? []);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void getGeneratedDocuments(user.id).then(({ data, error }) => {
      if (error || !data?.length) return;
      const remoteEntries: ArchiveEntry[] = data.map((entry) => ({
        id: entry.id,
        sourceId: entry.source_id,
        version: entry.version,
        archivedAt: entry.created_at,
        data: entry.data,
        label: entry.label ?? undefined,
      }));
      setArchive((current) => {
        const merged = [...current];
        remoteEntries.forEach((entry) => {
          if (!merged.some((item) => item.id === entry.id)) merged.push(entry);
        });
        return merged;
      });
    });
  }, [user?.id]);

  const filteredSources = useMemo(() => {
    if (!search && filterType === "all") return sources;
    return sources.filter((source) => {
      const matchesSearch = !search || source.title.toLowerCase().includes(search.toLowerCase()) || source.type.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || source.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [sources, search, filterType]);

  const archiveSource = async (source: Source, label?: string) => {
    const version = archive.filter((item) => item.sourceId === source.id).length + 1;
    const localId = crypto.randomUUID();
    const entry = { id: localId, sourceId: source.id, version, archivedAt: new Date().toISOString(), data: source.data, label };
    let next = [...archive, entry];
    storage.setItem(archiveKey, { entries: next });
    setArchive(next);

    if (!user?.school_id) return;
    const { data, error } = await createGeneratedDocument({
      school_id: user.school_id,
      teacher_id: user.id,
      source_type: source.type,
      source_id: source.id,
      version,
      label: label ?? null,
      data: source.data,
      file_url: null,
    });
    if (error || !data) return;
    next = next.map((item) => item.id === localId ? { ...item, id: data.id, archivedAt: data.created_at } : item);
    storage.setItem(archiveKey, { entries: next });
    setArchive(next);
  };

  const restoreArchive = (entry: ArchiveEntry) => {
    const key = sources.find((s) => s.id === entry.sourceId)?.key;
    if (!key) return;
    storage.setItem(key, { ...entry.data, updatedAt: new Date().toISOString() });
    setSelectedArchive(null);
    window.location.reload();
  };

  const exportDocx = async (source: Source) => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: source.type, data: source.data, format: "docx" }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${source.type.toLowerCase()}-gurukbc.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("DOCX export error:", error);
      // Fallback to local export
      let document: Document;
      switch (source.type) {
        case "PROTA": document = buildProtaDocx(source.data); break;
        case "PROMES": document = buildPromesDocx(source.data); break;
        case "KKTP": document = buildKktpDocx(source.data); break;
        case "MODUL": document = buildModuleDocx(source.data); break;
        case "ASESMEN": document = buildAssessmentDocx(source.data); break;
        default: document = new Document({ sections: [{ children: [new Paragraph({ text: source.title })] }] }); break;
      }
      const blob = await Packer.toBlob(document);
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${source.type.toLowerCase()}-gurukbc.docx`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportPdf = async (source: Source) => {
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: source.type, data: source.data, format: "pdf" }),
      });
      if (!response.ok) throw new Error("PDF export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${source.type.toLowerCase()}-gurukbc.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF export error:", error);
      // Fallback to print dialog
      printSource(source);
    }
  };

  const printSource = (source: Source) => {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    let previewHtml = "";
    switch (source.type) {
      case "PROTA": previewHtml = buildProtaPreview(source.data)?.props?.children ?? ""; break;
      case "PROMES": previewHtml = buildPromesPreview(source.data)?.props?.children ?? ""; break;
      case "KKTP": previewHtml = buildKktpPreview(source.data)?.props?.children ?? ""; break;
      case "MODUL": previewHtml = buildModulePreview(source.data)?.props?.children ?? ""; break;
      case "ASESMEN": previewHtml = buildAssessmentPreview(source.data)?.props?.children ?? ""; break;
    }
    popup.document.write(`<!doctype html><html><head><title>${source.title}</title><style>body{font:14px Arial;margin:28mm;color:#111}h1{font-size:20px;border-bottom:2px solid #222;padding-bottom:12px}li{margin:7px 0;line-height:1.4}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #303030;padding:8px;text-align:left}th{background:#f5f5f5}footer{margin-top:40px;display:flex;justify-content:space-between;font-size:12px}</style></head><body><h1>${source.title}</h1><p>GuruKBC · ${formatDate(source.updatedAt)}</p>${previewHtml}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const renderPreview = (source: Source) => {
    switch (source.type) {
      case "PROTA": return buildProtaPreview(source.data);
      case "PROMES": return buildPromesPreview(source.data);
      case "KKTP": return buildKktpPreview(source.data);
      case "MODUL": return buildModulePreview(source.data);
      case "ASESMEN": return buildAssessmentPreview(source.data);
      default: return <p className={styles.placeholder}>Pratinjau tidak tersedia untuk tipe dokumen ini.</p>;
    }
  };

  const types = useMemo(() => Array.from(new Set(sources.map((s) => s.type))), [sources]);

  return (
    <AppShell>
      <PageHeader eyebrow="DOKUMEN" title="Arsip perangkat pembelajaran" description="Kelola dokumen, simpan riwayat versi, dan ekspor DOCX atau PDF." action={
        <div className={styles.headerActions}>
          <input type="search" placeholder="Cari dokumen..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.search} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.filter}>
            <option value="all">Semua tipe</option>
            {types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      } />
      <section className={styles.summary}>
        <article><span>DOKUMEN TERSEDIA</span><strong>{sources.length}</strong><small>Perangkat tersimpan di perangkat ini</small></article>
        <article><span>VERSI DIARSIPKAN</span><strong>{totalVersions}</strong><small>Snapshot dokumen yang dapat dipulihkan</small></article>
        <article><span>FORMAT EKSPOR</span><strong>DOCX / PDF</strong><small>Berkas siap unduh dalam dua format</small></article>
      </section>
      {filteredSources.length === 0 ? (
        <section className="empty-state">
          <span>▤</span>
          <h2>Belum ada dokumen tersimpan</h2>
          <p>Simpan PROTA, PROMES, KKTP, Modul Ajar, atau Asesmen untuk mulai membangun arsip.</p>
        </section>
      ) : (
        <section className={styles.layout}>
          <div className={styles.list}>
            <section className="record-list">
              {filteredSources.map((source) => (
                <article className={`${styles.document} ${selected?.id === source.id ? styles.active : ""}`} key={source.id} onClick={() => { setSelected(source); setSelectedArchive(null); }}>
                  <div>
                    <span className={styles.type}>{source.type}</span>
                    <h2>{source.title}</h2>
                    <p>{source.summary} · {formatDate(source.updatedAt)}</p>
                  </div>
                    <div className={styles.documentActions}>
                      <button type="button" onClick={(event) => { event.stopPropagation(); void archiveSource(source, "Versi manual"); }}>Arsipkan</button>
                      <button type="button" className={styles.secondary} onClick={(event) => { event.stopPropagation(); void exportDocx(source); }}>DOCX</button>
                      <button type="button" className={styles.secondary} onClick={(event) => { event.stopPropagation(); void exportPdf(source); }}>PDF</button>
                    </div>
                </article>
              ))}
            </section>
            <section className={`panel ${styles.history}`}>
              <div className="panel-title"><div><h2>Riwayat versi</h2><p>Snapshot disimpan di perangkat dan disinkronkan saat akun terhubung.</p></div></div>
              {archive.length === 0 ? <p className={styles.emptyHistory}>Belum ada versi yang diarsipkan.</p> : (
                <ul>
                  {archive.slice().reverse().map((entry) => {
                    const source = sources.find((s) => s.id === entry.sourceId);
                    return (
                      <li key={entry.id} className={selectedArchive?.id === entry.id ? styles.archiveActive : ""} onClick={() => setSelectedArchive(entry)}>
                        <div><strong>{source?.type ?? "Dokumen"} · Versi {entry.version}</strong>{entry.label && <small>{entry.label}</small>}</div>
                        <div className={styles.archiveMeta}>
                          <span>{formatDate(entry.archivedAt)}</span>
                          <button type="button" className={styles.restoreBtn} onClick={(event) => { event.stopPropagation(); restoreArchive(entry); }}>Pulihkan</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
          <aside className={`panel ${styles.previewPanel}`}>
            {selectedArchive ? (
              <>
                <span className={styles.type}>{sources.find((s) => s.id === selectedArchive.sourceId)?.type ?? "ARSIP"}</span>
                <h2>Versi {selectedArchive.version} — {sources.find((s) => s.id === selectedArchive.sourceId)?.title ?? "Dokumen"}</h2>
                <p className={styles.archiveInfo}>Diarsipkan pada {formatDate(selectedArchive.archivedAt)}{selectedArchive.label ? ` · ${selectedArchive.label}` : ""}</p>
                <div className={styles.archivePreview}>
                  {(() => {
                    const source = sources.find((s) => s.id === selectedArchive.sourceId);
                    if (!source) return <p className={styles.placeholder}>Dokumen tidak ditemukan.</p>;
                    const archivedSource = { ...source, data: selectedArchive.data };
                    return renderPreview(archivedSource);
                  })()}
                </div>
                <div className={styles.actions}>
                  <button className={`button ${styles.secondary}`} onClick={() => setSelectedArchive(null)}>Kembali</button>
                  <button className="button button-primary" onClick={() => void exportDocx({ ...selected!, data: selectedArchive.data })}>Unduh DOCX</button>
                  <button className="button button-primary" onClick={() => void exportPdf({ ...selected!, data: selectedArchive.data })}>Unduh PDF</button>
                </div>
              </>
            ) : selected ? (
              <>
                <span className={styles.type}>{selected.type}</span>
                <h2>{selected.title}</h2>
                <p className={styles.updated}>Terakhir diperbarui: {formatDate(selected.updatedAt)}</p>
                <div className={styles.previewContainer}>
                  {renderPreview(selected)}
                </div>
                <div className={styles.actions}>
                  <button className={`button ${styles.secondary}`} onClick={() => exportPdf(selected)}>Unduh PDF</button>
                  <button className="button button-primary" onClick={() => void exportDocx(selected)}>Unduh DOCX</button>
                  <button className={`button ${styles.secondary}`} onClick={() => void archiveSource(selected, "Versi manual")}>Arsipkan versi</button>
                </div>
              </>
            ) : (
              <div className={styles.emptyPreview}>
                <span>▤</span>
                <h3>Pilih dokumen untuk pratinjau</h3>
                <p>Pilih salah satu dokumen dari daftar untuk melihat pratinjau A4, mengekspor DOCX, atau mencetak PDF.</p>
              </div>
            )}
          </aside>
        </section>
      )}
    </AppShell>
  );
}
