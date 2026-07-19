import type { Metadata } from "next";
import { AuthProvider } from "@/lib/supabase/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuruKBC | Administrasi Guru Berbasis Cinta",
  description: "Platform administrasi guru untuk perangkat pembelajaran KBC.",
  icons: {
    icon: "/gurukbc-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
