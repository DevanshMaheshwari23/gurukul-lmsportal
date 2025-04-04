/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js App Router is enabled by default in Next.js 13+
  // Define the directory structure explicitly to avoid confusion
  distDir: '.next',
  output: 'standalone',
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during production builds
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 