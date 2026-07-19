import { NextRequest, NextResponse } from "next/server";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { jsPDF } from "jspdf";

export const runtime = "nodejs";

const supportedTypes = new Set(["PROTA", "PROMES", "KKTP", "MODUL", "ASESMEN"]);

// Helper function to build DOCX document based on type
function buildDocxDocument(type: string, data: Record<string, unknown>): Document {
  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  const children: Paragraph[] = [];

  switch (type) {
    case "PROTA": {
      const objectives = (data as { objectives?: Array<{ code?: string; description?: string; semester?: 1 | 2; hours?: number }> }).objectives ?? [];
      const totalHours = objectives.reduce((total, item) => total + (item.hours ?? 0), 0);
      children.push(new Paragraph({ text: "PROGRAM TAHUNAN", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }));
      children.push(new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }));
      children.push(new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }));
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      children.push(new Paragraph({ text: "Daftar Tujuan Pembelajaran", heading: HeadingLevel.HEADING_2 }));
      objectives.forEach((item, index) => {
        children.push(new Paragraph({ text: `${index + 1}. ${item.code} - ${item.description} (Semester ${item.semester}, ${item.hours} JP)`, bullet: { level: 0 } }));
      });
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      children.push(new Paragraph({ text: `Jumlah Total JP: ${totalHours}`, spacing: { after: 100 } }));
      break;
    }
    case "PROMES": {
      const allocations = (data as { allocations?: Array<{ weekNumber?: number; semester?: 1 | 2; code?: string; description?: string; hours?: number }> }).allocations ?? [];
      const totalHours = allocations.reduce((total, item) => total + (item.hours ?? 0), 0);
      children.push(new Paragraph({ text: "PROGRAM SEMESTER", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }));
      children.push(new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }));
      children.push(new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }));
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      children.push(new Paragraph({ text: "Distribusi Tujuan Pembelajaran", heading: HeadingLevel.HEADING_2 }));
      allocations.forEach((item, index) => {
        children.push(new Paragraph({ text: `${index + 1}. Pekan ${item.weekNumber} (Semester ${item.semester}): ${item.code} - ${item.description} (${item.hours} JP)`, bullet: { level: 0 } }));
      });
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      children.push(new Paragraph({ text: `Jumlah Total JP: ${totalHours}` }));
      break;
    }
    case "KKTP": {
      const criteria = (data as { criteria?: Array<{ code?: string; description?: string; technique?: string; minimum?: number; descriptionCriterion?: string }> }).criteria ?? [];
      children.push(new Paragraph({ text: "KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }));
      children.push(new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }));
      children.push(new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }));
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      children.push(new Paragraph({ text: "Daftar Kriteria Ketercapaian", heading: HeadingLevel.HEADING_2 }));
      criteria.forEach((item, index) => {
        children.push(new Paragraph({ text: `${index + 1}. ${item.code} - ${item.description}`, bullet: { level: 0 } }));
        children.push(new Paragraph({ text: `Teknik: ${item.technique} | Nilai Minimum: ${item.minimum}`, bullet: { level: 1 } }));
        children.push(new Paragraph({ text: `Kriteria: ${item.descriptionCriterion}`, bullet: { level: 1 } }));
      });
      break;
    }
    case "MODUL": {
      const modules = (data as { modules?: Array<{ title?: string; meetings?: number; model?: string; initialCompetency?: string; meaningfulUnderstanding?: string; triggerQuestion?: string; learningActivities?: string; assessment?: string }> }).modules ?? [];
      const mod = modules[0];
      children.push(new Paragraph({ text: "MODUL AJAR", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: "DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }));
      children.push(new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }));
      children.push(new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }));
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      if (mod) {
        children.push(new Paragraph({ text: mod.title ?? "Modul Ajar", heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph({ text: `Alokasi Waktu: ${mod.meetings} pertemuan` }));
        children.push(new Paragraph({ text: `Model Pembelajaran: ${mod.model}`, spacing: { after: 100 } }));
        children.push(new Paragraph({ text: "Kompetensi Awal", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: mod.initialCompetency ?? "-" }));
        children.push(new Paragraph({ text: "Pemahaman Bermakna", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: mod.meaningfulUnderstanding ?? "-" }));
        children.push(new Paragraph({ text: "Pertanyaan Pemantik", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: mod.triggerQuestion ?? "-" }));
        children.push(new Paragraph({ text: "Kegiatan Pembelajaran", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: mod.learningActivities ?? "-" }));
        children.push(new Paragraph({ text: "Asesmen", heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: mod.assessment ?? "-" }));
      }
      break;
    }
    case "ASESMEN": {
      const assessments = (data as { assessments?: Array<{ title?: string; phase?: string; technique?: string; questions?: Array<{ prompt?: string; score?: number }> }> }).assessments ?? [];
      const assessment = assessments[0];
      children.push(new Paragraph({ text: `INSTRUMEN ASESMEN ${assessment?.phase?.toUpperCase() ?? "FORMATIF"}`, heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: assessment?.title ?? "ASESMEN", heading: HeadingLevel.HEADING_1 }));
      children.push(new Paragraph({ text: `Tahun Pelajaran ${meta.year ?? "-"}`, spacing: { after: 200 } }));
      children.push(new Paragraph({ children: [new TextRun("Mata Pelajaran: "), new TextRun(meta.subject ?? "-")] }));
      children.push(new Paragraph({ children: [new TextRun("Kelas / Fase: "), new TextRun(meta.grade ?? "-")] }));
      children.push(new Paragraph({ children: [new TextRun("Teknik Asesmen: "), new TextRun(assessment?.technique ?? "-")] }));
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      children.push(new Paragraph({ text: "Butir Asesmen", heading: HeadingLevel.HEADING_2 }));
      assessment?.questions?.forEach((item, index) => {
        children.push(new Paragraph({ text: `${index + 1}. ${item.prompt} (Skor: ${item.score})`, bullet: { level: 0 } }));
      });
      break;
    }
    default:
      children.push(new Paragraph({ text: "Dokumen tidak didukung" }));
  }

  return new Document({ sections: [{ children }] });
}

// Helper function to generate PDF document based on type
function generatePdfDocument(type: string, data: Record<string, unknown>): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const meta = (data as { meta?: { subject?: string; grade?: string; year?: string } }).meta ?? {};
  let yPosition = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const maxWidth = pageWidth - 2 * margin;

  // Header
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.text(`${type.toUpperCase()}`, margin, yPosition);
  yPosition += 8;

  doc.setFontSize(12);
  doc.text("DEEP LEARNING KURIKULUM BERBASIS CINTA (KBC)", margin, yPosition);
  yPosition += 8;

  // Meta information
  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  doc.text(`Tahun Pelajaran: ${meta.year ?? "-"}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Mata Pelajaran: ${meta.subject ?? "-"}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Kelas/Fase: ${meta.grade ?? "-"}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Dibuat: ${new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}`, margin, yPosition);
  yPosition += 10;

  // Content based on type
  switch (type) {
    case "PROTA": {
      const objectives = (data as { objectives?: Array<{ code?: string; description?: string; semester?: 1 | 2; hours?: number }> }).objectives ?? [];
      doc.setFont("Helvetica", "bold");
      doc.text("Daftar Tujuan Pembelajaran:", margin, yPosition);
      yPosition += 6;
      doc.setFont("Helvetica", "normal");
      
      objectives.forEach((item, index) => {
        const text = `${index + 1}. ${item.code} - ${item.description} (Semester ${item.semester}, ${item.hours} JP)`;
        const wrapped = doc.splitTextToSize(text, maxWidth);
        wrapped.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
      });
      break;
    }
    case "PROMES": {
      const allocations = (data as { allocations?: Array<{ weekNumber?: number; semester?: 1 | 2; code?: string; description?: string; hours?: number }> }).allocations ?? [];
      doc.setFont("Helvetica", "bold");
      doc.text("Distribusi Tujuan Pembelajaran:", margin, yPosition);
      yPosition += 6;
      doc.setFont("Helvetica", "normal");
      
      allocations.forEach((item, index) => {
        const text = `${index + 1}. Pekan ${item.weekNumber} (Semester ${item.semester}): ${item.code} - ${item.description} (${item.hours} JP)`;
        const wrapped = doc.splitTextToSize(text, maxWidth);
        wrapped.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += 6;
        });
      });
      break;
    }
    case "KKTP": {
      const criteria = (data as { criteria?: Array<{ code?: string; description?: string; technique?: string; minimum?: number; descriptionCriterion?: string }> }).criteria ?? [];
      doc.setFont("Helvetica", "bold");
      doc.text("Daftar Kriteria Ketercapaian:", margin, yPosition);
      yPosition += 6;
      doc.setFont("Helvetica", "normal");
      
      criteria.forEach((item, index) => {
        if (yPosition > pageHeight - margin * 2) {
          doc.addPage();
          yPosition = margin;
        }
        const itemText = `${index + 1}. ${item.code} - ${item.description}`;
        doc.text(itemText, margin + 5, yPosition);
        yPosition += 5;
        doc.setFontSize(8);
        doc.text(`Teknik: ${item.technique} | Min: ${item.minimum}`, margin + 10, yPosition);
        yPosition += 4;
        const critWrapped = doc.splitTextToSize(String(item.descriptionCriterion ?? "-"), maxWidth - 10);
        critWrapped.forEach((line: string) => {
          doc.text(line, margin + 10, yPosition);
          yPosition += 4;
        });
        doc.setFontSize(10);
        yPosition += 2;
      });
      break;
    }
    case "MODUL": {
      const modules = (data as { modules?: Array<{ title?: string; meetings?: number; model?: string; initialCompetency?: string; meaningfulUnderstanding?: string; triggerQuestion?: string; learningActivities?: string; assessment?: string }> }).modules ?? [];
      const mod = modules[0];
      if (mod) {
        doc.setFont("Helvetica", "bold");
        doc.text(mod.title ?? "Modul Ajar", margin, yPosition);
        yPosition += 6;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Alokasi: ${mod.meetings} pertemuan | Model: ${mod.model}`, margin, yPosition);
        yPosition += 8;

        const sections = [
          { title: "Kompetensi Awal", content: mod.initialCompetency },
          { title: "Pemahaman Bermakna", content: mod.meaningfulUnderstanding },
          { title: "Pertanyaan Pemantik", content: mod.triggerQuestion },
          { title: "Kegiatan Pembelajaran", content: mod.learningActivities },
          { title: "Asesmen", content: mod.assessment },
        ];

        sections.forEach((section) => {
          if (yPosition > pageHeight - margin * 2) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setFont("Helvetica", "bold");
          doc.text(section.title, margin + 5, yPosition);
          yPosition += 5;
          doc.setFont("Helvetica", "normal");
          const wrapped = doc.splitTextToSize(String(section.content ?? "-"), maxWidth - 10);
          wrapped.forEach((line: string) => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin + 10, yPosition);
            yPosition += 4;
          });
          yPosition += 3;
        });
      }
      break;
    }
    case "ASESMEN": {
      const assessments = (data as { assessments?: Array<{ title?: string; phase?: string; technique?: string; questions?: Array<{ prompt?: string; score?: number }> }> }).assessments ?? [];
      const assessment = assessments[0];
      if (assessment) {
        doc.setFont("Helvetica", "bold");
        doc.text(`${assessment.phase?.toUpperCase() ?? "FORMATIF"} - ${assessment.title}`, margin, yPosition);
        yPosition += 6;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Teknik: ${assessment.technique}`, margin, yPosition);
        yPosition += 8;

        doc.setFont("Helvetica", "bold");
        doc.text("Butir Asesmen:", margin, yPosition);
        yPosition += 6;
        doc.setFont("Helvetica", "normal");

        assessment.questions?.forEach((item, index) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          const questionText = `${index + 1}. ${item.prompt} (Skor: ${item.score})`;
          const wrapped = doc.splitTextToSize(questionText, maxWidth - 10);
          wrapped.forEach((line: string) => {
            doc.text(line, margin + 5, yPosition);
            yPosition += 5;
          });
        });
      }
      break;
    }
  }

  return doc;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, format } = body as { type?: unknown; data?: unknown; format?: unknown };

    if (typeof type !== "string" || !supportedTypes.has(type) || !data || typeof data !== "object" || (format !== "docx" && format !== "pdf")) {
      return NextResponse.json({ error: "Missing required fields: type, data, format" }, { status: 400 });
    }
    const documentData = data as Record<string, unknown>;

    if (format === "docx") {
      const document = buildDocxDocument(type, documentData);
      const blob = await Packer.toBlob(document);
      const arrayBuffer = await blob.arrayBuffer();

      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${type.toLowerCase()}-gurukbc.docx"`,
        },
      });
    } else if (format === "pdf") {
      const doc = generatePdfDocument(type, documentData);
      const arrayBuffer = doc.output("arraybuffer");
      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${type.toLowerCase()}-gurukbc.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format. Use 'docx' or 'pdf'" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export document" }, { status: 500 });
  }
}
