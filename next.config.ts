import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves this project beneath /MEDVISION-AI/.
  // Keep the root path unchanged for local development.
  basePath: process.env.GITHUB_PAGES === "true" ? "/MEDVISION-AI" : "",
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  trailingSlash: true,
};

export default nextConfig;
