import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [400, 640, 828, 1080, 1280, 1600, 1920],
    qualities: [60, 65, 68, 72, 75, 78, 82],
  },
};

export default nextConfig;
