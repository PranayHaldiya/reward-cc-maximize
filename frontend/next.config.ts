import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'your-production-domain.com'],
     eslint: {
      ignoreDuringBuilds: false,
  },
};

export default nextConfig;
