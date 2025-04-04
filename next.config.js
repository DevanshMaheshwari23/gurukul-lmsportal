/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Use basePath in all environments for consistency
  basePath: '/gurukul',
  assetPrefix: '/gurukul',
  // Customize API routes to make sure they work with the basePath
  async rewrites() {
    return [
      {
        source: '/gurukul/api/:path*',
        destination: '/api/:path*',
      }
    ];
  },
  // Turn off image optimization
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig; 