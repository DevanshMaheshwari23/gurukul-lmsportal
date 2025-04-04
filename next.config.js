/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Use basePath in production only
  basePath: process.env.NODE_ENV === 'production' ? '/gurukul' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/gurukul' : '',
  // Customize API routes to make sure they work with the basePath
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/gurukul/api/:path*',
          destination: '/api/:path*',
        }
      ];
    }
    return [];
  },
  // Configure image optimization
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig; 