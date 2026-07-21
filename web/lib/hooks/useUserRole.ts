import { useEffect, useState } from "react";
import { getUserMembership } from "@/lib/supabase/queries";
import type { ProfileRole } from "@/lib/supabase/types";

const MANAGER_ROLES: ProfileRole[] = ["owner", "admin", "principal"];

export function useUserRole() {
  const [role, setRole] = useState<ProfileRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const membership = await getUserMembership();
      setRole((membership?.role as ProfileRole) ?? null);
      setLoading(false);
    })();
  }, []);

  return {
    role,
    loading,
    // Selama role belum diketahui (mis. Supabase belum dikonfigurasi), jangan
    // mengunci form -- lebih aman gagal terbuka daripada mengunci semua orang.
    canManage: loading || role === null || MANAGER_ROLES.includes(role),
  };
}
