import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/users/:path*',
        destination: '/api/users/:path*',
      },
      {
        source: '/auth/:path*',
        destination: '/api/auth/:path*',
      },
      {
        source: '/hackathons/:path*',
        destination: '/api/hackathons/:path*',
      },
      {
        source: '/activities/:path*',
        destination: '/api/activities/:path*',
      },
      {
        source: '/notifications/:path*',
        destination: '/api/notifications/:path*',
      },
      {
        source: '/upload',
        destination: '/api/upload',
      },
    ];
  },
};

export default nextConfig;
