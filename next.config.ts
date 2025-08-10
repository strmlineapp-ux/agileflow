import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'https://*.cloudworkstations.dev',
    'https://3000-firebase-studio-1754598633229.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev'
  ],
};

export default nextConfig;