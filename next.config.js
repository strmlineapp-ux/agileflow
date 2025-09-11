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
   webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
  ) => {
    config.externals.push({
      canvas: "commonjs canvas",
    });
    return config
  },
  env: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  }
};

module.exports = nextConfig;
