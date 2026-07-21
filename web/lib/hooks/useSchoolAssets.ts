import { useEffect, useState } from "react";
import { getUserSchoolId, getSchoolAssets, getSchoolAssetPublicUrl } from "@/lib/supabase/queries";
import { storage } from "@/lib/supabase/storage";
import type { SchoolAsset } from "@/lib/supabase/types";

type SchoolAssetsState = {
  logoUrl: string;
  signatureUrl: string;
  headmasterName: string;
};

export function useSchoolAssets(): SchoolAssetsState {
  const [state, setState] = useState<SchoolAssetsState>({ logoUrl: "", signatureUrl: "", headmasterName: "" });

  useEffect(() => {
    const school = storage.getItem<Partial<{ headmaster_name: string }>>("gurukbc-school");
    if (school?.headmaster_name) {
      setState((current) => ({ ...current, headmasterName: school.headmaster_name! }));
    }

    (async () => {
      const schoolId = await getUserSchoolId();
      if (!schoolId) return;
      const { data } = await getSchoolAssets(schoolId);
      const rows = (data ?? []) as SchoolAsset[];
      const logo = rows.find((row) => row.asset_type === "logo");
      const signature = rows.find((row) => row.asset_type === "signature");
      setState((current) => ({
        ...current,
        logoUrl: logo ? getSchoolAssetPublicUrl(logo.file_path) : "",
        signatureUrl: signature ? getSchoolAssetPublicUrl(signature.file_path) : "",
      }));
    })();
  }, []);

  return state;
}
