"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import styles from "./help.module.css";

const CHECKLIST = [
  "Daftar & masuk akun",
  "Profil Guru terisi",
  "Profil Sekolah/Madrasah terisi (Kepala Sekolah/Madrasah/Admin)",
  "Tahun Pelajaran terisi",
  "Mata Pelajaran & Kelas dipilih dan disimpan",
  "Logo & Tanda Tangan diunggah (Kepala Sekolah/Madrasah/Admin)",
  "Kalender Akademik diisi",
  "Analisis Hari Efektif disimpan",
  "Analisis Pekan Efektif disimpan",
  "PROTA disimpan",
  "PROMES disimpan",
  "KKTP disimpan",
  "Modul Ajar dibuat",
  "Asesmen dibuat",
  "Dokumen diekspor DOCX/PDF dari menu Dokumen",
];

export default function HelpPage() {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const stored = storage.getItem<Record<number, boolean>>("gurukbc-help-checklist");
    if (stored && Object.keys(stored).length) setChecked(stored);
  }, []);

  function toggle(index: number) {
    setChecked((current) => {
      const next = { ...current, [index]: !current[index] };
      storage.setItem("gurukbc-help-checklist", next);
      return next;
    });
  }

  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <AppShell>
      <PageHeader
        eyebrow="BANTUAN"
        title="Panduan Penggunaan GuruKBC"
        description="Urutan lengkap dari daftar akun sampai dokumen siap dicetak. Isi setiap tahap dari atas ke bawah."
      />

      <section className={`panel ${styles.flow}`}>
        <div className="panel-title"><div><h2>Alur kerja singkat</h2><p>Setiap tahap memakai data dari tahap sebelumnya secara otomatis.</p></div></div>
        <ol className={styles.flowList}>
          <li><b>Master Data</b> — Profil Guru, Profil Sekolah/Madrasah, Tahun Pelajaran, Mata Pelajaran &amp; Kelas, Pengaturan Aset</li>
          <li><b>Kalender &amp; Analisis</b> — Kalender Akademik → Analisis Hari Efektif → Analisis Pekan Efektif</li>
          <li><b>Perencanaan</b> — PROTA → PROMES → KKTP → Modul Ajar → Asesmen</li>
          <li><b>Dokumen</b> — Arsipkan, ekspor DOCX/PDF, cetak</li>
        </ol>
        <p className={styles.hint}>Kalau Anda melewati satu tahap, tahap berikutnya akan memberi tahu data apa yang masih kurang — tidak perlu takut salah urutan.</p>
      </section>

      <details className={styles.section} open>
        <summary>1. Daftar &amp; Masuk</summary>
        <ol>
          <li>Buka halaman <b>Masuk</b>. Belum punya akun? Klik <b>&quot;Daftar sekarang&quot;</b>, isi email dan kata sandi.</li>
          <li>Sudah punya akun? Isi <b>Email</b> dan <b>Kata Sandi</b>, klik <b>Masuk</b>.</li>
          <li>Lupa kata sandi? Klik <b>&quot;Lupa kata sandi?&quot;</b> di halaman yang sama.</li>
        </ol>
        <p>Setelah berhasil masuk, Anda akan diarahkan ke <b>Dashboard</b>.</p>
      </details>

      <details className={styles.section}>
        <summary>2. Master Data</summary>
        <p>Menu <b>Master Data</b> ada di sidebar kiri. Isi kelima kartu berikut secara berurutan.</p>
        <h3>2.1 Profil Guru</h3>
        <p>Identitas Anda sebagai guru: nama, NIP/NUPTK, pendidikan, jabatan. Muncul otomatis di kop dokumen.</p>
        <h3>2.2 Profil Sekolah/Madrasah <span className={styles.tag}>Kepala Sekolah/Madrasah/Admin</span></h3>
        <p>Nama sekolah/madrasah, NPSN/NSM, nama Kepala Sekolah/Madrasah, alamat, email. Guru biasa hanya bisa melihat, tidak bisa mengubah.</p>
        <h3>2.3 Tahun Pelajaran</h3>
        <p>Nama tahun pelajaran beserta tanggal tiap semester — acuan Kalender Akademik dan seluruh dokumen Perencanaan.</p>
        <h3>2.4 Mata Pelajaran &amp; Kelas</h3>
        <p><b>Mata Pelajaran</b>: tinggal centang dari daftar standar SD/MI — tidak perlu ketik manual. <b>Kelas &amp; Rombel</b>: tambahkan nama kelas dan pilih Fase-nya (A = kelas 1-2, B = kelas 3-4, C = kelas 5-6). Klik <b>&quot;Simpan data&quot;</b>.</p>
        <h3>2.5 Pengaturan Aset <span className={styles.tag}>Kepala Sekolah/Madrasah/Admin</span></h3>
        <p>Unggah Logo Sekolah/Madrasah dan Tanda Tangan Kepala Sekolah/Madrasah (PNG/JPG, maks. 2 MB). Otomatis muncul di semua dokumen — tidak perlu tempel manual satu-satu.</p>
      </details>

      <details className={styles.section}>
        <summary>3. Kalender &amp; Analisis Waktu</summary>
        <h3>3.1 Kalender Akademik</h3>
        <p>Tandai hari libur, kegiatan sekolah, dan hari efektif: isi nama agenda, pilih jenis (Libur/Kegiatan/Hari efektif), isi tanggal, klik <b>&quot;Tambah ke kalender&quot;</b>.</p>
        <h3>3.2 Analisis Hari Efektif</h3>
        <p>Otomatis menghitung hari efektif belajar per bulan dari Kalender Akademik. Klik <b>&quot;Simpan analisis&quot;</b>.</p>
        <h3>3.3 Analisis Pekan Efektif</h3>
        <p>Menghitung per pekan — menentukan kapasitas jam pelajaran (JP) untuk PROTA. Klik <b>&quot;Simpan analisis&quot;</b>.</p>
      </details>

      <details className={styles.section}>
        <summary>4. Perencanaan — inti dari GuruKBC</summary>
        <p>Urutan berikut <b>wajib</b> diikuti karena tiap dokumen menarik data dari dokumen sebelumnya.</p>
        <h3>4.1 PROTA (Program Tahunan)</h3>
        <ol>
          <li>Pilih <b>Mata Pelajaran</b> dan <b>Kelas</b> — otomatis dari Master Data.</li>
          <li>Di panel <b>Bank Tujuan Pembelajaran (KBC)</b>: pilih Tema → Topik → klik <b>&quot;+ Tambah&quot;</b> pada TP yang sesuai. Tinggal pilih, tanpa ketik dan tanpa typo. Kalau bank belum tersedia, pakai form manual di bawahnya.</li>
          <li>Cek panel <b>Validasi alokasi JP</b> agar tidak melebihi kapasitas.</li>
          <li>Klik <b>&quot;Simpan PROTA&quot;</b>.</li>
        </ol>
        <h3>4.2 PROMES (Program Semester)</h3>
        <p>Terbuka otomatis dari PROTA + Analisis Pekan Efektif. Periksa hasilnya, klik <b>&quot;Simpan PROMES&quot;</b>.</p>
        <h3>4.3 KKTP</h3>
        <p>Muncul otomatis dari TP di PROTA. Pilih teknik asesmen dan nilai minimum per TP, klik <b>&quot;Simpan KKTP&quot;</b>.</p>
        <h3>4.4 Modul Ajar</h3>
        <p>Pilih Tujuan Pembelajaran dari dropdown, lengkapi rancangan pembelajaran. Klik <b>&quot;✨ Buatkan draf dengan AI&quot;</b> kalau ingin bantuan draf awal Kompetensi Awal, Pemahaman Bermakna, Pertanyaan Pemantik, dan Kegiatan Pembelajaran — <b>selalu baca dan sesuaikan draf AI ini</b> sebelum disimpan, karena sifatnya bantuan awal, bukan hasil final. Klik <b>&quot;Simpan Modul&quot;</b>.</p>
        <h3>4.5 Asesmen</h3>
        <p>Pilih Tujuan Pembelajaran, tambahkan butir soal beserta skornya, klik <b>&quot;Simpan Asesmen&quot;</b>.</p>
      </details>

      <details className={styles.section}>
        <summary>5. Dokumen — arsip dan ekspor</summary>
        <p>Menu <b>Dokumen</b> menampilkan semua PROTA/PROMES/KKTP/Modul Ajar/Asesmen yang tersimpan.</p>
        <ul>
          <li>Klik dokumen di daftar kiri untuk pratinjau A4 di kanan.</li>
          <li><b>Unduh DOCX</b> / <b>Unduh PDF</b> untuk file siap cetak/kirim.</li>
          <li><b>Arsipkan versi</b> untuk menyimpan snapshot sebagai riwayat sebelum direvisi.</li>
          <li><b>Pulihkan</b> pada riwayat versi untuk melihat/mengunduh ulang versi lama.</li>
        </ul>
        <p className={styles.hint}>Tombol &quot;Cetak / PDF&quot; di tiap halaman Perencanaan adalah jalan pintas cetak cepat. Untuk DOCX yang bisa diedit ulang di Word, gunakan halaman Dokumen.</p>
      </details>

      <details className={styles.section}>
        <summary>6. Peran pengguna — siapa bisa apa</summary>
        <table className={styles.roleTable}>
          <thead><tr><th>Peran</th><th>Master Data &amp; Perencanaan</th><th>Profil Sekolah/Madrasah &amp; Pengaturan Aset</th></tr></thead>
          <tbody>
            <tr><td>Kepala Sekolah/Madrasah / Owner / Admin</td><td>✅</td><td>✅</td></tr>
            <tr><td>Guru</td><td>✅</td><td>❌ (hanya lihat)</td></tr>
          </tbody>
        </table>
        <p>Kalau Anda guru dan perlu logo/tanda tangan diunggah atau data sekolah/madrasah diperbarui, sampaikan ke Kepala Sekolah/Madrasah atau Admin sekolah Anda.</p>
      </details>

      <details className={styles.section}>
        <summary>7. Masa uji coba</summary>
        <p>Akun baru mendapat masa uji coba gratis <b>7 hari</b> atau <b>5 dokumen tersimpan</b>, mana yang tercapai lebih dulu. Sisa masa uji coba terlihat di sidebar kiri bawah. Setelah habis, tombol Simpan berhenti bekerja dan muncul tombol &quot;Hubungi kami untuk upgrade&quot;.</p>
      </details>

      <details className={styles.section}>
        <summary>8. Tips &amp; pemecahan masalah</summary>
        <ul>
          <li><b>Dropdown Mata Pelajaran/Kelas kosong di PROTA?</b> Lengkapi dulu Master Data ▸ Mata Pelajaran &amp; Kelas.</li>
          <li><b>Bank TP kosong untuk mapel tertentu?</b> Isinya bertahap; sementara pakai form tambah manual.</li>
          <li><b>Logo/tanda tangan tidak muncul?</b> Pastikan sudah diunggah di Master Data ▸ Pengaturan Aset.</li>
          <li><b>PROMES/KKTP kosong terus?</b> Pastikan PROTA (dan Analisis Pekan Efektif) sudah benar-benar diklik Simpan.</li>
          <li><b>Tombol Simpan tidak bisa diklik?</b> Cek badge masa uji coba di sidebar.</li>
        </ul>
      </details>

      <section className={`panel ${styles.checklistPanel}`}>
        <div className="panel-title"><div><h2>Checklist onboarding</h2><p>Centang setiap tahap yang sudah selesai — tersimpan otomatis.</p></div><strong>{doneCount}/{CHECKLIST.length}</strong></div>
        <ul className={styles.checklist}>
          {CHECKLIST.map((item, index) => (
            <li key={item}>
              <label>
                <input type="checkbox" checked={!!checked[index]} onChange={() => toggle(index)} />
                <span className={checked[index] ? styles.done : ""}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
