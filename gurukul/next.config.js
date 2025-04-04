/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Use basePath for client routes
  basePath: '/gurukul',
  assetPrefix: '/gurukul',
  // Allow API timeout to be longer
  serverRuntimeConfig: {
    // Will only be available on the server side
    apiTimeout: 60000, // 60 seconds
  },
  // Turn off image optimization
  images: {
    unoptimized: true,
  },
  // Customize API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      {
        source: '/gurukul/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
