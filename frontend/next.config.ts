/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-production-domain.com'],
  },
  eslint: {
    dirs: ['pages', 'utils', ], // Include app directory for ESLint
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
