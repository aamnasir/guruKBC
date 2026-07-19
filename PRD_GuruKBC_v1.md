# Product Requirements Document (PRD)

# GuruKBC

## SaaS Administrasi Guru -- Deep Learning Kurikulum Berbasis Cinta (KBC)

Version: 1.0

## 1. Vision

GuruKBC adalah platform SaaS administrasi guru yang mengotomatisasi
penyusunan perangkat pembelajaran berbasis Deep Learning Kurikulum
Berbasis Cinta (KBC). Guru mengisi data sekali, lalu sistem menghasilkan
dokumen yang saling terhubung.

## 2. Goals

-   Mengurangi pekerjaan administratif guru.
-   Menjamin konsistensi data.
-   Menghasilkan dokumen profesional (Preview, DOCX, PDF).
-   Menyimpan seluruh dokumen sebagai arsip digital.

## 3. Target Users

-   Guru MI/SD
-   Guru Mata Pelajaran
-   Guru Kelas
-   Kepala Madrasah
-   Administrator Sekolah

## 4. Core Workflow

1.  Profil Guru
2.  Profil Madrasah
3.  Tahun Pelajaran
4.  Kalender Akademik
5.  Analisis Hari Efektif
6.  Analisis Pekan Efektif
7.  PROTA
8.  PROMES
9.  KKTP
10. Modul Ajar KBC
11. Asesmen
12. Arsip & Ekspor

## 5. Information Architecture

### Dashboard

-   Ringkasan progres perangkat
-   Aktivitas terbaru
-   Statistik kelas, mapel, dokumen
-   Quick Actions

### Master Data

-   Profil Guru
-   Profil Madrasah
-   Tahun Pelajaran
-   Mata Pelajaran
-   Kelas
-   Peserta Didik

### Perencanaan

-   Kalender Akademik
-   Analisis Hari Efektif
-   Analisis Pekan Efektif
-   PROTA
-   PROMES
-   KKTP
-   Modul Ajar KBC

### Dokumen

-   Arsip
-   Preview
-   DOCX
-   PDF
-   Riwayat Versi

### Pengaturan

-   Template Dokumen
-   Logo & Tanda Tangan
-   Preferensi

## 6. Functional Requirements

### Profil Guru

Data identitas, NIP/NUPTK, kontak, pendidikan, jabatan, tanda tangan.

### Profil Madrasah

Nama, NPSN/NSM, alamat, kepala madrasah, logo, aset dokumen.

### Kalender Akademik

Input kalender dan libur; menjadi dasar perhitungan otomatis.

### Analisis Hari Efektif

Hitung hari efektif per bulan/semester otomatis.

### Analisis Pekan Efektif

Hitung pekan efektif dan distribusi JP.

### PROTA

-   Menggunakan template resmi.
-   Judul: **Program Tahunan Deep Learning Kurikulum Berbasis Cinta
    (KBC)**.
-   Generate dari TP + JP.
-   Preview A4.
-   Simpan sebagai dokumen.

### PROMES

Distribusi TP ke minggu efektif berdasarkan hasil APE.

### KKTP

Dibuat otomatis dari TP dan PROMES.

### Modul Ajar KBC

Menggabungkan profil, kelas, ATP, KKTP, PROTA, PROMES.

## 7. Document Engine

Semua dokumen: - Preview - DOCX - PDF - Arsip - Versioning - Re-generate
tanpa input ulang

## 8. Dashboard KPIs

-   Progress administrasi
-   Checklist modul
-   Dokumen terbaru
-   Aktivitas terbaru

## 9. Database (High Level)

-   teacher_profiles
-   school_profiles
-   academic_years
-   subjects
-   teacher_classes
-   students
-   academic_calendar
-   effective_days
-   effective_weeks
-   learning_objectives
-   prota
-   promes
-   kktp
-   teaching_modules
-   generated_documents
-   school_assets
-   document_templates

## 10. Non Functional Requirements

-   Next.js 15
-   Supabase Auth/PostgreSQL/Storage
-   Responsive
-   Audit log
-   Auto save
-   Role-based access
-   Multi-school ready

## 11. Roadmap

Sprint 1: Foundation (Profil, Sekolah, Tahun Pelajaran, Kelas) Sprint 2:
Kalender Akademik Sprint 3: Analisis Hari Efektif Sprint 4: Analisis
Pekan Efektif Sprint 5: PROTA Sprint 6: PROMES Sprint 7: KKTP Sprint 8:
Modul Ajar KBC Sprint 9: Asesmen Sprint 10: Arsip Dokumen & Ekspor

## 12. Success Metrics

-   Waktu pembuatan perangkat turun \>70%.
-   100% dokumen dapat di-preview dan diunduh.
-   Semua dokumen tersimpan sebagai arsip digital.
-   Tidak ada input data ganda antar modul.
