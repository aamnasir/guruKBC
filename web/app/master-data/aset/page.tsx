"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { AppShell } from "@/app/components/AppShell";
import { PageHeader } from "@/app/components/PageHeader";
import {
  getUser,
  getUserSchoolId,
  getSchoolAssets,
  upsertSchoolAsset,
  deleteSchoolAsset,
  uploadSchoolAssetFile,
  getSchoolAssetPublicUrl,
  removeSchoolAssetFile,
} from "@/lib/supabase/queries";
import type { SchoolAsset } from "@/lib/supabase/types";
import { useUserRole } from "@/lib/hooks/useUserRole";
import styles from "./assets.module.css";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

type AssetSlot = { type: "logo" | "signature"; label: string; hint: string };

const SLOTS: AssetSlot[] = [
  { type: "logo", label: "Logo Sekolah/Madrasah", hint: "Dipakai di kop surat dan pratinjau dokumen. Format PNG/JPG, latar transparan lebih baik." },
  { type: "signature", label: "Tanda Tangan Kepala Sekolah/Madrasah", hint: "Dipakai pada bagian pengesahan dokumen (PROTA, PROMES, KKTP, Modul Ajar)." },
];

export default function SchoolAssetsPage() {
  const { canManage } = useUserRole();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Record<string, SchoolAsset>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    (async () => {
      const id = await getUserSchoolId();
      setSchoolId(id);
      if (id) {
        const { data } = await getSchoolAssets(id);
        const map: Record<string, SchoolAsset> = {};
        (data ?? []).forEach((row: SchoolAsset) => { map[row.asset_type] = row; });
        setAssets(map);
      }
      setLoading(false);
    })();
  }, []);

  async function handleUpload(assetType: "logo" | "signature", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !schoolId) return;
    setError("");
    setNotice("");
    if (!file.type.startsWith("image/")) { setError("File harus berupa gambar (PNG atau JPG)."); return; }
    if (file.size > MAX_SIZE) { setError("Ukuran file maksimal 2 MB."); return; }

    setUploading(assetType);
    const { data: uploaded, error: uploadError } = await uploadSchoolAssetFile(schoolId, assetType, file);
    if (uploadError || !uploaded) {
      setUploading(null);
      setError("Gagal mengunggah file. Pastikan Supabase Storage sudah dikonfigurasi (lihat schema_school_assets.sql).");
      return;
    }
    const user = await getUser();
    const { data: saved, error: saveError } = await upsertSchoolAsset({
      school_id: schoolId,
      asset_type: assetType,
      file_name: file.name,
      file_path: uploaded.path,
      file_size: file.size,
      mime_type: file.type,
      created_by: user?.id ?? "",
    });
    setUploading(null);
    if (saveError || !saved) { setError("File terunggah, tapi gagal menyimpan datanya. Coba lagi."); return; }
    setAssets((current) => ({ ...current, [assetType]: saved as SchoolAsset }));
    setNotice(`${assetType === "logo" ? "Logo" : "Tanda tangan"} berhasil disimpan.`);
  }

  async function handleRemove(assetType: "logo" | "signature") {
    const asset = assets[assetType];
    if (!asset) return;
    setError("");
    setNotice("");
    await removeSchoolAssetFile(asset.file_path);
    const { error: deleteError } = await deleteSchoolAsset(asset.id);
    if (deleteError) { setError("Gagal menghapus file."); return; }
    setAssets((current) => { const next = { ...current }; delete next[assetType]; return next; });
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="MASTER DATA / PENGATURAN ASET"
        title="Pengaturan Aset"
        description="Unggah logo madrasah dan tanda tangan kepala madrasah sekali di sini, dipakai otomatis di semua dokumen (PROTA, PROMES, KKTP, Modul Ajar)."
      />

      {loading ? (
        <p className={styles.empty}>Memuat data aset...</p>
      ) : !schoolId ? (
        <div className={styles.empty}>
          <strong>Profil madrasah belum lengkap.</strong>
          <span>Lengkapi dulu di <a href="/master-data/madrasah">Master Data &raquo; Profil Sekolah/Madrasah</a> sebelum mengunggah aset.</span>
        </div>
      ) : (
        <div className={styles.grid}>
          {SLOTS.map((slot) => {
            const asset = assets[slot.type];
            const publicUrl = asset ? getSchoolAssetPublicUrl(asset.file_path) : "";
            return (
              <section className="panel" key={slot.type}>
                <div className="panel-title">
                  <div>
                    <h2>{slot.label}</h2>
                    <p>{slot.hint}</p>
                  </div>
                  <span className={asset ? "status success" : "status"}>{asset ? "Terunggah" : "Belum diisi"}</span>
                </div>
                <div className={styles.previewBox}>
                  {publicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicUrl} alt={slot.label} className={slot.type === "signature" ? styles.signatureImg : styles.logoImg} />
                  ) : (
                    <span className={styles.placeholder}>Belum ada file</span>
                  )}
                </div>
                <div className={styles.actions}>
                  {canManage ? (
                    <>
                      <label className={`button ${styles.secondary}`}>
                        {uploading === slot.type ? "Mengunggah..." : asset ? "Ganti file" : "Unggah file"}
                        <input type="file" accept="image/png,image/jpeg" hidden onChange={(event) => handleUpload(slot.type, event)} disabled={uploading === slot.type} />
                      </label>
                      {asset && (
                        <button type="button" className={styles.remove} onClick={() => handleRemove(slot.type)}>Hapus</button>
                      )}
                    </>
                  ) : (
                    <small className={styles.readonly}>Hanya kepala madrasah/admin yang bisa mengubah aset ini.</small>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.saved}>{notice}</p>}
    </AppShell>
  );
}
