import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'your-production-domain.com'],
  },
  eslint: {
    dirs: ['components', 'public'], // Only run ESLint on the 'pages' and 'utils' directories during production builds (next build)
  },
};

export default nextConfig;
