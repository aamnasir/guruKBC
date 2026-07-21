import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type DraftRequest = {
  subject?: string;
  className?: string;
  phase?: string;
  objectiveCode?: string;
  objectiveDescription?: string;
  model?: string;
  meetings?: number;
};

type DraftResult = {
  initialCompetency: string;
  meaningfulUnderstanding: string;
  triggerQuestion: string;
  learningActivities: string;
};

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Fitur draf AI belum diaktifkan. Admin perlu menambahkan ANTHROPIC_API_KEY di pengaturan Vercel." },
      { status: 503 }
    );
  }

  let body: DraftRequest;
  try {
    body = (await request.json()) as DraftRequest;
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const { subject, className, phase, objectiveCode, objectiveDescription, model, meetings } = body;
  if (!subject || !objectiveDescription) {
    return NextResponse.json({ error: "Pilih tujuan pembelajaran terlebih dahulu." }, { status: 400 });
  }

  const prompt = `Anda membantu guru ${subject} SD/MI di Indonesia menyusun DRAF AWAL Modul Ajar Kurikulum Berbasis Cinta (KBC) untuk kelas ${className || "-"} (Fase ${phase || "-"}).

Tujuan Pembelajaran (jadikan acuan utama, jangan diubah maknanya):
${objectiveCode ? `${objectiveCode}: ` : ""}${objectiveDescription}

Model pembelajaran: ${model || "Pembelajaran Berbasis Proyek"}
Jumlah pertemuan: ${meetings || 1}

Buatkan draf singkat berbahasa Indonesia, bahasa sederhana dan konkret sesuai usia anak SD/MI, untuk empat bagian berikut:
1. Kompetensi Awal: 1-2 kalimat, prasyarat kemampuan siswa sebelum pembelajaran ini.
2. Pemahaman Bermakna: 1-2 kalimat, inti pemahaman besar yang diharapkan tertanam pada siswa.
3. Pertanyaan Pemantik: satu pertanyaan terbuka untuk membuka pembelajaran.
4. Kegiatan Pembelajaran: langkah kegiatan ringkas berupa poin-poin, mencakup pendahuluan, inti, dan penutup.

Ini adalah draf yang akan diperiksa dan diedit guru sebelum dipakai -- jangan mengklaim sudah final atau sudah sesuai standar resmi mana pun.

Balas HANYA dengan JSON valid seperti berikut, tanpa markdown code fence dan tanpa teks lain di luar JSON:
{"initialCompetency": "...", "meaningfulUnderstanding": "...", "triggerQuestion": "...", "learningActivities": "..."}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Anthropic API error:", response.status, detail);
      return NextResponse.json({ error: "Gagal membuat draf. Coba lagi beberapa saat lagi." }, { status: 502 });
    }

    const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .map((block) => (block.type === "text" ? block.text ?? "" : ""))
      .join("");
    const cleaned = text.replace(/```json|```/g, "").trim();

    let parsed: Partial<DraftResult>;
    try {
      parsed = JSON.parse(cleaned) as Partial<DraftResult>;
    } catch {
      console.error("Failed to parse AI draft response:", text);
      return NextResponse.json({ error: "Draf yang dihasilkan tidak dapat dibaca. Coba lagi." }, { status: 502 });
    }

    const result: DraftResult = {
      initialCompetency: String(parsed.initialCompetency ?? ""),
      meaningfulUnderstanding: String(parsed.meaningfulUnderstanding ?? ""),
      triggerQuestion: String(parsed.triggerQuestion ?? ""),
      learningActivities: String(parsed.learningActivities ?? ""),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("generate-modul-draft error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat membuat draf." }, { status: 500 });
  }
}
