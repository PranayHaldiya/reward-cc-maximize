/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-production-domain.com'],
  },
  eslint: {
    dirs: ['pages', 'utils'], 
    typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: true,
    // Only run ESLint on the 'pages' and 'utils' directories during production builds (next build)
  },
};

export default nextConfig;
