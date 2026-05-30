import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Ignore test files and development dependencies from thread-stream
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];

    // Use null-loader to ignore test, bench, and non-JS files
    config.module.rules.push({
      test: /node_modules\/thread-stream\/(test|bench)\/.*/,
      use: 'null-loader',
    });

    config.module.rules.push({
      test: /node_modules\/thread-stream\/(LICENSE|README\.md)/,
      use: 'null-loader',
    });

    // Fallbacks for node modules
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      pino: false,
      'pino-pretty': false,
      encoding: false,
    };

    // Externalize thread-stream on server side
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'thread-stream': 'commonjs thread-stream',
        });
      }
    }

    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tse3.mm.bing.net' },
      { protocol: 'https', hostname: 'tse1.mm.bing.net' },
      { protocol: 'https', hostname: 'tse4.mm.bing.net' },
      { protocol: 'https', hostname: 'www.scholarshipregion.com' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
      { protocol: 'https', hostname: '**.ipfs.dweb.link' },
    ],
  },



  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

export default nextConfig;
