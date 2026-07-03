import type { NextConfig } from 'next';
import path from 'path';

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
const apiOrigin = apiUrl.replace(/\/api\/v1\/?$/, '');

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
