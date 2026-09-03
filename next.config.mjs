/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/near-me',
        destination: '/nearby',
        permanent: true,
      },
    ];
  },
  devIndicators: false,
};

export default nextConfig;
