"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./subjects.module.css";

type SubjectItem = { id: string; name: string; code: string };
type ClassItem = { id: string; name: string; phase: string };

// Katalog mata pelajaran standar SD/MI (Kurikulum Merdeka + mapel PAI
// terpisah untuk MI sesuai KMA 183/2019). Guru tinggal centang, tidak
// perlu mengetik manual sehingga tidak ada typo pada dokumen resmi.
const SUBJECT_CATALOG: { group: string; items: { name: string; code: string }[] }[] = [
  {
    group: "Umum (SD & MI)",
    items: [
      { name: "Pendidikan Pancasila", code: "PPKN" },
      { name: "Bahasa Indonesia", code: "B.INA" },
      { name: "Matematika", code: "MTK" },
      { name: "Ilmu Pengetahuan Alam dan Sosial (IPAS)", code: "IPAS" },
      { name: "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)", code: "PJOK" },
      { name: "Seni Budaya", code: "SBDP" },
    ],
  },
  {
    group: "Pendidikan Agama (SD)",
    items: [
      { name: "Pendidikan Agama Islam dan Budi Pekerti", code: "PAIBP" },
      { name: "Pendidikan Agama Kristen dan Budi Pekerti", code: "PAKBP" },
      { name: "Pendidikan Agama Katolik dan Budi Pekerti", code: "PAKAT" },
      { name: "Pendidikan Agama Hindu dan Budi Pekerti", code: "PAHBP" },
      { name: "Pendidikan Agama Buddha dan Budi Pekerti", code: "PABBP" },
    ],
  },
  {
    group: "Pendidikan Agama Islam (khusus MI)",
    items: [
      { name: "Al-Qur'an Hadis", code: "QH" },
      { name: "Akidah Akhlak", code: "AA" },
      { name: "Fikih", code: "FIQ" },
      { name: "Sejarah Kebudayaan Islam (SKI)", code: "SKI" },
      { name: "Bahasa Arab", code: "B.ARAB" },
    ],
  },
  {
    group: "Muatan Lokal & Pilihan",
    items: [
      { name: "Bahasa Inggris", code: "B.ING" },
      { name: "Bahasa Daerah", code: "MULOK" },
      { name: "Informatika", code: "INFO" },
      { name: "Coding dan Kecerdasan Artifisial", code: "CAI" },
    ],
  },
];

export default function SubjectsClassesPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = storage.getItem<Partial<{ subjects: SubjectItem[]; classes: ClassItem[] }>>("gurukbc-mapel-kelas");
    if (stored) {
      setSubjects(stored.subjects ?? []);
      setClasses(stored.classes ?? []);
    }
  }, []);

  const selectedNames = useMemo(() => new Set(subjects.map((item) => item.name)), [subjects]);

  const save = async () => {
    await storage.setItem("gurukbc-mapel-kelas", { subjects, classes });
    setSaved(true);
  };

  function toggleSubject(name: string, code: string) {
    setSubjects((current) => {
      if (current.some((item) => item.name === name)) {
        return current.filter((item) => item.name !== name);
      }
      return [...current, { id: crypto.randomUUID(), name, code }];
    });
    setSaved(false);
  }

  function addCustomSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name || selectedNames.has(name)) return;
    setSubjects((current) => [...current, { id: crypto.randomUUID(), name, code: String(form.get("code") ?? "").trim() }]);
    setSaved(false);
    event.currentTarget.reset();
  }

  function addClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name) return;
    setClasses((current) => [...current, { id: crypto.randomUUID(), name, phase: String(form.get("phase") ?? "") }]);
    setSaved(false);
    event.currentTarget.reset();
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="MASTER DATA / MATA PELAJARAN & KELAS"
        title="Mata Pelajaran & Kelas"
        description="Pilih mata pelajaran dari daftar standar SD/MI dan daftarkan kelas atau rombel yang Anda ajar. Data ini dipakai pada PROTA, PROMES, KKTP, dan Modul Ajar."
        action={<button className="button button-primary" onClick={save}>Simpan data</button>}
      />
      <section className={styles.summary} aria-label="Ringkasan mata pelajaran dan kelas">
        <article>
          <span>MATA PELAJARAN</span>
          <strong>{subjects.length}</strong>
          <small>Mata pelajaran terpilih</small>
        </article>
        <article>
          <span>KELAS / ROMBEL</span>
          <strong>{classes.length}</strong>
          <small>Kelas atau rombel terdaftar</small>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Mata Pelajaran</h2>
            <p>Centang mata pelajaran yang Anda ampu agar tidak perlu mengetik manual.</p>
          </div>
          <span className="status">{subjects.length} mapel</span>
        </div>
        <div className={styles.catalog}>
          {SUBJECT_CATALOG.map((group) => (
            <div key={group.group} className={styles.catalogGroup}>
              <h3>{group.group}</h3>
              <div className={styles.checkGrid}>
                {group.items.map((item) => (
                  <label key={item.name} className={styles.checkItem}>
                    <input
                      type="checkbox"
                      checked={selectedNames.has(item.name)}
                      onChange={() => toggleSubject(item.name, item.code)}
                    />
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <form className={styles.inlineForm} onSubmit={addCustomSubject}>
          <label className={styles.grow}>
            Mata pelajaran lain (tidak ada di daftar)
            <input name="name" placeholder="Contoh: Tahfiz Al-Qur'an" />
          </label>
          <label>
            Kode
            <input name="code" placeholder="Contoh: TAHFIZ" />
          </label>
          <button className={`button ${styles.secondary}`}>Tambah manual</button>
        </form>
        {subjects.length === 0 && (
          <div className={styles.empty}>
            <strong>Belum ada mata pelajaran terpilih.</strong>
            <span>Centang minimal satu mata pelajaran untuk melanjutkan ke tahap Perencanaan.</span>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h2>Kelas & Rombel</h2>
            <p>Tambahkan kelas atau rombongan belajar yang Anda ajar.</p>
          </div>
          <span className="status">{classes.length} kelas</span>
        </div>
        <form className={styles.inlineForm} onSubmit={addClass}>
          <label className={styles.grow}>
            Nama kelas / rombel
            <input name="name" required placeholder="Contoh: Kelas IV-A" />
          </label>
          <label>
            Fase
            <select name="phase" defaultValue="">
              <option value="">Pilih fase</option>
              <option value="A">Fase A (Kelas 1-2)</option>
              <option value="B">Fase B (Kelas 3-4)</option>
              <option value="C">Fase C (Kelas 5-6)</option>
            </select>
          </label>
          <button className={`button ${styles.secondary}`}>Tambah</button>
        </form>
        {classes.length === 0 ? (
          <div className={styles.empty}>
            <strong>Belum ada kelas.</strong>
            <span>Tambahkan minimal satu kelas untuk menetapkan penugasan mengajar.</span>
          </div>
        ) : (
          <ul className={styles.list}>
            {classes.map((klass) => (
              <li key={klass.id}>
                <div>
                  <strong>{klass.name}</strong>
                  {klass.phase && <small>Fase {klass.phase}</small>}
                </div>
                <button type="button" onClick={() => { setClasses((current) => current.filter((item) => item.id !== klass.id)); setSaved(false); }}>Hapus</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className={styles.saved}>{saved ? "Data tersimpan dan disinkronkan ke Supabase." : "Klik \"Simpan data\" setelah memilih mata pelajaran dan menambahkan kelas."}</p>
    </AppShell>
  );
}
