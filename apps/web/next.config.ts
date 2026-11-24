import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@amigo/core",
    "@amigo/adapter-memory",
    "@amigo/adapter-ics",
  ],
  cacheComponents: true,
  // The service worker must never be cached, or a fix would not reach
  // installed apps until the old copy expired.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
