/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration Turbopack pour Next.js 16
  turbopack: {},
  async rewrites() {
    return [
      {
        source: '/ws',
        destination: 'http://localhost:4000'
      }
    ];
  },
};

export default nextConfig;