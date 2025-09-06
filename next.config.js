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
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
        '@genkit-ai/googleai',
        '@opentelemetry/instrumentation',
        'handlebars',
        'require-in-the-middle'
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
};

module.exports = nextConfig;
