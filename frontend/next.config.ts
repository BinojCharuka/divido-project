import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    let raw = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
    if (!raw) return [];
    if (!raw.startsWith("http://") && !raw.startsWith("https://") && !raw.startsWith("/")) {
      raw = `https://${raw}`;
    }
    const backendUrl = raw.replace(/\/+$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
