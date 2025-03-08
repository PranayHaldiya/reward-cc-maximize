import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'your-production-domain.com'],
  },
};

export default nextConfig;
