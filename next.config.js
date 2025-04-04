/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure middleware works correctly
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Turn off image optimization on Netlify
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig; 