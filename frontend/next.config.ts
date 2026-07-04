import type { NextConfig } from 'next';
import path from 'path';

const backendApiUrl =
  process.env.BACKEND_API_URL ?? 'http://localhost:5000/api/v1';
const backendOrigin = backendApiUrl.replace(/\/api\/v\d+\/?$/, '');

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
        source: '/api/v1/:path*',
        destination: `${backendApiUrl}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
