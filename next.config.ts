import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/legal-agreements/*": ["./public/legal/*.pdf"],
  },
};

export default nextConfig;
