const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${api}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
