/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

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

export default nextConfig; 