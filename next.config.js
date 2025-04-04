/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Remove basePath as Vercel handles the routing
  basePath: '',
  assetPrefix: '',
  // Configure image optimization
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: false,
  },
  // Add proper transpilation for certain Node.js packages
  transpilePackages: ['bcrypt', 'bcryptjs']
};

module.exports = nextConfig; 