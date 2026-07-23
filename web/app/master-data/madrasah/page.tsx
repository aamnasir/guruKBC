"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import { storage } from "@/lib/supabase/storage";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { getUserSchoolId, getSchool } from "@/lib/supabase/queries";

export default function SchoolPage() {
  const { canManage } = useUserRole();
  const [saved, setSaved] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [form, setForm] = useState({ name: "", npsn_nsm: "", headmaster_name: "", address: "", email: "" });

  useEffect(() => {
    const stored = storage.getItem<typeof form>("gurukbc-school");
    if (stored && Object.keys(stored).length) {
      setForm((current) => ({ ...current, ...stored }));
    }
    (async () => {
      const schoolId = await getUserSchoolId();
      if (!schoolId) return;
      const { data } = await getSchool(schoolId);
      if (data) setJoinCode((data as { join_code?: string }).join_code ?? "");
    })();
  }, []);

  const save = async () => {
    await storage.setItem("gurukbc-school", form);
    setSaved(true);
  };

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setSaved(false);
  };

  return <AppShell><PageHeader eyebrow="MASTER DATA / PROFIL SEKOLAH-MADRASAH" title="Profil Sekolah/Madrasah" description="Identitas resmi untuk header, pengesahan, dan arsip dokumen." />
    {canManage && joinCode && <div className="panel" style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><strong style={{ display: "block", fontSize: 13 }}>Kode Sekolah</strong><span style={{ color: "var(--muted)", fontSize: 12.5 }}>Bagikan kode ini ke guru Anda supaya bisa bergabung saat mendaftar.</span></div><b style={{ fontSize: 20, letterSpacing: 3, color: "var(--teal)" }}>{joinCode}</b></div>}
    <form className="form-panel" onSubmit={(event) => { event.preventDefault(); save(); }}><fieldset disabled={!canManage} style={{ border: 0, padding: 0, margin: 0 }}><div className="form-grid"><label>Nama sekolah/madrasah<input value={form.name} onChange={update("name")} required placeholder="Contoh: MI Nurul Ilmi" /></label><label>NPSN / NSM<input value={form.npsn_nsm} onChange={update("npsn_nsm")} placeholder="Masukkan NPSN atau NSM" /></label><label>Kepala madrasah<input value={form.headmaster_name} onChange={update("headmaster_name")} placeholder="Nama dan gelar" /></label><label>Email institusi<input type="email" value={form.email ?? ""} onChange={update("email")} placeholder="info@madrasah.sch.id" /></label><label className="full">Alamat<textarea value={form.address} onChange={update("address")} rows={3} placeholder="Alamat lengkap madrasah" /></label></div></fieldset><div className="form-actions"><span>{!canManage ? "Hanya kepala madrasah/admin yang bisa mengubah profil madrasah." : saved ? "Data tersimpan dan disinkronkan ke Supabase." : "Logo dan tanda tangan dapat ditambahkan pada pengaturan aset."}</span>{canManage && <button type="submit" className="button button-primary">Simpan madrasah</button>}</div></form>
  </AppShell>;
}
