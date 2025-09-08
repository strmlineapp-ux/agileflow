
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
    // This is the recommended fix for the Wasm build error.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    config.externals.push({
      canvas: "commonjs canvas",
    });
    return config
  },
};

module.exports = nextConfig;
