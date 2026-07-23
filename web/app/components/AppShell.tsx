"use client"; 

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/supabase/AuthContext";
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
const initials = ((user?.user_metadata?.full_name || user?.email || "G") as string).slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/"><Image src="/gurukbc-logo.svg" alt="" width={28} height={28} priority />GuruKBC</Link>
        <p className="brand-subtitle">Administrasi guru yang terhubung</p>
        <nav aria-label="Navigasi utama">{sections.map((item) => <Link key={item.href} href={item.href} className="nav-link"><span>{item.icon}</span>{item.label}</Link>)}</nav>
        <div className="sidebar-footer">
          <span className="avatar">{initials}</span>
          <div>
            <strong>{user?.user_metadata?.full_name ?? "Guru"}</strong>
            <small>{user?.user_metadata?.position ?? "Guru Mata Pelajaran"}</small>
            {user?.user_metadata?.role && <small style={{ textTransform: "capitalize" }}>{(user.user_metadata.role as string).replace("_", " ")}</small>}
            <TrialBadge />
            <button type="button" className="sign-out" onClick={signOut}>Keluar</button>
          </div>
        </div>
      </aside>
      <main className="main-content"><OnboardingBanner />{children}</main>
    </div>
  );
}
