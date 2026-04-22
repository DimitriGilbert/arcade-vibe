import "@arcade-vibe/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["shiki"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@ai-sdk/openai",
      "@ai-sdk/anthropic",
      "@ai-sdk/google",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/trpc/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; connect-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
