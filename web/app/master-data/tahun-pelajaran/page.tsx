"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./academic-year.module.css";

type AcademicYearForm = {
  name: string;
  start_date: string;
  end_date: string;
  semester_1_start: string;
  semester_1_end: string;
  semester_2_start: string;
  semester_2_end: string;
};

const initial: AcademicYearForm = {
  name: "2026/2027",
  start_date: "2026-07-13",
  end_date: "2027-06-19",
  semester_1_start: "2026-07-13",
  semester_1_end: "2026-12-19",
  semester_2_start: "2027-01-05",
  semester_2_end: "2027-06-19",
};

export default function AcademicYearPage() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AcademicYearForm>(initial);

  useEffect(() => {
    const stored = storage.getItem<AcademicYearForm>("gurukbc-academic-year");
    if (stored && Object.keys(stored).length) {
      setForm((current) => ({ ...current, ...stored }));
    }
  }, []);

  const update = (key: keyof AcademicYearForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setSaved(false);
  };

  const save = async () => {
    if (form.end_date < form.start_date) {
      setError("Tanggal selesai tahun pelajaran tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    if (form.semester_1_end < form.semester_1_start) {
      setError("Tanggal selesai semester 1 tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    if (form.semester_2_end < form.semester_2_start) {
      setError("Tanggal selesai semester 2 tidak boleh lebih awal dari tanggal mulai.");
      return;
    }
    setError("");
    await storage.setItem("gurukbc-academic-year", form);
    setSaved(true);
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="MASTER DATA / TAHUN PELAJARAN"
        title="Tahun Pelajaran"
        description="Periode ini menjadi acuan Kalender Akademik, Analisis Hari/Pekan Efektif, hingga PROTA dan PROMES."
      />
      <section className={styles.summary} aria-label="Ringkasan tahun pelajaran">
        <article>
          <span>TAHUN PELAJARAN</span>
          <strong>{form.name || "-"}</strong>
          <small>Nama tahun pelajaran aktif</small>
        </article>
        <article>
          <span>SEMESTER 1</span>
          <strong>{form.semester_1_start && form.semester_1_end ? "Terjadwal" : "-"}</strong>
          <small>{form.semester_1_start || "-"} s.d. {form.semester_1_end || "-"}</small>
        </article>
        <article>
          <span>SEMESTER 2</span>
          <strong>{form.semester_2_start && form.semester_2_end ? "Terjadwal" : "-"}</strong>
          <small>{form.semester_2_start || "-"} s.d. {form.semester_2_end || "-"}</small>
        </article>
      </section>
      <form className="form-panel" onSubmit={(event) => { event.preventDefault(); void save(); }}>
        <div className="form-grid">
          <label className="full">
            Nama tahun pelajaran
            <input value={form.name} onChange={update("name")} required placeholder="Contoh: 2026/2027" />
          </label>
          <label>
            Tanggal mulai tahun pelajaran
            <input type="date" value={form.start_date} onChange={update("start_date")} required />
          </label>
          <label>
            Tanggal selesai tahun pelajaran
            <input type="date" value={form.end_date} onChange={update("end_date")} required />
          </label>
          <label>
            Mulai semester 1
            <input type="date" value={form.semester_1_start} onChange={update("semester_1_start")} required />
          </label>
          <label>
            Selesai semester 1
            <input type="date" value={form.semester_1_end} onChange={update("semester_1_end")} required />
          </label>
          <label>
            Mulai semester 2
            <input type="date" value={form.semester_2_start} onChange={update("semester_2_start")} required />
          </label>
          <label>
            Selesai semester 2
            <input type="date" value={form.semester_2_end} onChange={update("semester_2_end")} required />
          </label>
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className="form-actions">
          <span>{saved ? "Tahun pelajaran tersimpan dan disinkronkan ke Supabase." : "Data ini dipakai otomatis oleh Kalender Akademik dan tahap Perencanaan lainnya."}</span>
          <button type="submit" className="button button-primary">Simpan tahun pelajaran</button>
        </div>
      </form>
    </AppShell>
  );
}
