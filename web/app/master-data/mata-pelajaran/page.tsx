"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./subjects.module.css";

type SubjectItem = { id: string; name: string; code: string };
type ClassItem = { id: string; name: string; phase: string };

export default function SubjectsClassesPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = storage.getItem<{ subjects: SubjectItem[]; classes: ClassItem[] }>("gurukbc-mapel-kelas");
    if (stored) {
      setSubjects(stored.subjects ?? []);
      setClasses(stored.classes ?? []);
    }
  }, []);

  const save = async () => {
    await storage.setItem("gurukbc-mapel-kelas", { subjects, classes });
    setSaved(true);
  };

  function addSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    if (!name) return;
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
        description="Daftarkan mata pelajaran yang diampu dan kelas atau rombel yang diajar. Data ini dipakai pada PROTA, PROMES, KKTP, dan Modul Ajar."
        action={<button className="button button-primary" onClick={save}>Simpan data</button>}
      />
      <section className={styles.summary} aria-label="Ringkasan mata pelajaran dan kelas">
        <article>
          <span>MATA PELAJARAN</span>
          <strong>{subjects.length}</strong>
          <small>Mata pelajaran terdaftar</small>
        </article>
        <article>
          <span>KELAS / ROMBEL</span>
          <strong>{classes.length}</strong>
          <small>Kelas atau rombel terdaftar</small>
        </article>
      </section>

      <div className={styles.layout}>
        <section className="panel">
          <div className="panel-title">
            <div>
              <h2>Mata Pelajaran</h2>
              <p>Tambahkan mata pelajaran yang Anda ampu.</p>
            </div>
            <span className="status">{subjects.length} mapel</span>
          </div>
          <form className={styles.inlineForm} onSubmit={addSubject}>
            <label className={styles.grow}>
              Nama mata pelajaran
              <input name="name" required placeholder="Contoh: Matematika" />
            </label>
            <label>
              Kode
              <input name="code" placeholder="Contoh: MTK" />
            </label>
            <button className={`button ${styles.secondary}`}>Tambah</button>
          </form>
          {subjects.length === 0 ? (
            <div className={styles.empty}>
              <strong>Belum ada mata pelajaran.</strong>
              <span>Tambahkan minimal satu mata pelajaran untuk melanjutkan ke tahap Perencanaan.</span>
            </div>
          ) : (
            <ul className={styles.list}>
              {subjects.map((subject) => (
                <li key={subject.id}>
                  <div>
                    <strong>{subject.name}</strong>
                    {subject.code && <small>Kode: {subject.code}</small>}
                  </div>
                  <button type="button" onClick={() => { setSubjects((current) => current.filter((item) => item.id !== subject.id)); setSaved(false); }}>Hapus</button>
                </li>
              ))}
            </ul>
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
                <option value="A">Fase A</option>
                <option value="B">Fase B</option>
                <option value="C">Fase C</option>
                <option value="D">Fase D</option>
                <option value="E">Fase E</option>
                <option value="F">Fase F</option>
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
      </div>
      <p className={styles.saved}>{saved ? "Data tersimpan dan disinkronkan ke Supabase." : "Klik \"Simpan data\" setelah menambahkan mata pelajaran dan kelas."}</p>
    </AppShell>
  );
}
