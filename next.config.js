/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Отдавать картинки напрямую из /public, без проксирования через /_next/image
    unoptimized: true,
  },
};

module.exports = nextConfig;
