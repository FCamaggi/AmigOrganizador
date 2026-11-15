import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@amigo/core",
    "@amigo/adapter-memory",
    "@amigo/adapter-ics",
  ],
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
};

export default nextConfig;
