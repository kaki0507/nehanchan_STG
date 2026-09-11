import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ← この行を追加
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;