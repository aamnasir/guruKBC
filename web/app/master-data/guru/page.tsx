"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { useAuth } from "@/lib/supabase/AuthContext";

export default function TeacherPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name ?? "",
    nip_nuptk: "",
    email: user?.email ?? "",
    phone: "",
    education: "",
    position: user?.user_metadata?.position ?? "Guru Kelas",
  });

  useEffect(() => {
    const stored = storage.getItem<typeof form>("gurukbc-profile");
    if (stored && Object.keys(stored).length) {
      // Only update if there's actual change to avoid unnecessary re-renders
      const hasChanges = JSON.stringify(stored) !== JSON.stringify(form);
      if (hasChanges) {
        setForm((current) => ({ ...current, ...stored }));
      }
    }
  }, [form]);

  const save = async () => {
    await storage.setItem("gurukbc-profile", form);
    setSaved(true);
  };

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setSaved(false);
  };

  return <AppShell><PageHeader eyebrow="MASTER DATA / PROFIL GURU" title="Profil Guru" description="Data ini otomatis tampil pada dokumen yang Anda buat." />
    <form className="form-panel" onSubmit={(event) => { event.preventDefault(); save(); }}><div className="form-grid"><label>Nama lengkap<input value={form.full_name} onChange={update("full_name")} required /></label><label>NIP / NUPTK<input value={form.nip_nuptk} onChange={update("nip_nuptk")} placeholder="Masukkan NIP atau NUPTK" /></label><label>Email<input type="email" value={form.email} onChange={update("email")} /></label><label>Nomor WhatsApp<input type="tel" value={form.phone} onChange={update("phone")} placeholder="08xxxxxxxxxx" /></label><label>Pendidikan terakhir<select value={form.education} onChange={update("education")}><option value="">Pilih pendidikan</option><option>S1</option><option>S2</option><option>S3</option></select></label><label>Jabatan<select value={form.position} onChange={update("position")}><option>Guru Kelas</option><option>Guru Mata Pelajaran</option><option>Kepala Madrasah</option></select></label></div><div className="form-actions"><span>{saved ? "Tersimpan dan disinkronkan ke Supabase." : "Perubahan akan tersimpan otomatis."}</span><button type="submit" className="button button-primary">Simpan profil</button></div></form>
    </AppShell>;
}