/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Use basePath for page routes but not for API routes
  basePath: '/gurukul',
  assetPrefix: '/gurukul',
  // Turn off image optimization
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
