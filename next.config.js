/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure for subdirectory deployment
  basePath: '/gurukul',
  assetPrefix: '/gurukul',
  // Turn off image optimization
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig; 