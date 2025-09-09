
/** @type {import('next').NextConfig} */
const nextConfig = {
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
       {
        protocol: 'https',
        hostname: 'picsum.photos',
      }
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
        '@genkit-ai/googleai',
        '@opentelemetry/instrumentation',
        'handlebars',
        'require-in-the-middle',
        'google-auth-library'
    ],
  },
};

module.exports = nextConfig;
