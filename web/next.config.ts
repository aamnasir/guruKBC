import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Menetapkan absolute path ke folder induk monorepo (guruKBC)
    root: path.resolve(process.cwd(), ".."),
  },
  // Pertahankan konfigurasi esensial lainnya jika ada...
};

export default nextConfig;
