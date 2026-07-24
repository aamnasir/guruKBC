"use client"; 

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { storage } from "@/lib/supabase/storage";
import { TrialBadge } from "./TrialBadge";
import { OnboardingBanner } from "./OnboardingBanner";

const sections = [
  { label: "Dashboard", href: "/", icon: "⌂" },
  { label: "Master Data", href: "/master-data", icon: "◫" },
  { label: "Perencanaan", href: "/perencanaan", icon: "◷" },
  { label: "Dokumen", href: "/dokumen", icon: "▤" },
  { label: "Langganan", href: "/langganan", icon: "★" },
  { label: "Bantuan", href: "/bantuan", icon: "?" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const [profile, setProfile] = useState<{ full_name?: string; position?: string }>({});

  useEffect(() => {
    const stored = storage.getItem<{ full_name?: string; position?: string }>("gurukbc-profile");
    if (stored && Object.keys(stored).length) setProfile(stored);
  }, []);

  const displayName = profile.full_name || (user?.user_metadata?.full_name as string) || "Guru";
  const displayPosition = profile.position || (user?.user_metadata?.position as string) || "Guru Mata Pelajaran";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><Image src="/gurukbc-logo.svg" alt="" width={28} height={28} priority />GuruKBC</Link>
        <p className="brand-subtitle">Administrasi guru yang terhubung</p>
        <nav aria-label="Navigasi utama">{sections.map((item) => <Link key={item.href} href={item.href} className="nav-link"><span>{item.icon}</span>{item.label}</Link>)}</nav>
        <div className="sidebar-footer">
          <span className="avatar">{initials}</span>
          <div>
            <strong>{displayName}</strong>
            <small>{displayPosition}</small>
            {role && <small style={{ textTransform: "capitalize" }}>{role.replace("_", " ")}</small>}
            <TrialBadge />
            <button type="button" className="sign-out" onClick={signOut}>Keluar</button>
          </div>
        </div>
      </aside>
      <main className="main-content"><OnboardingBanner />{children}</main>
    </div>
  );
}
