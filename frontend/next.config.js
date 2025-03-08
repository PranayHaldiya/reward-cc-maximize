/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-production-domain.com'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  eslint: {
    dirs: [ 'components'],
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
