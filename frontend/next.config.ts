import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TODO: Remove these ignore flags after fixing TypeScript/ESLint errors
  // Run `npm run type-check` and `npm run lint` to see current errors
  // Priority fixes needed:
  // 1. framer-motion ease type issues (use "easeOut" as const)
  // 2. Missing interface properties (CompetitorProfile, TechnologyArea)
  // 3. Prior-art page status type mismatches
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false, // Don't enforce trailing slashes on Next.js routes
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "127.0.0.1:3000",
    "localhost:3000"
  ],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'], // Optimize specific packages
  },

  // Performance optimizations
  compress: true, // Enable gzip compression

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Production optimization
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Bundle analysis in production
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for react and react-dom
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Separate chunk for framer-motion
            framerMotion: {
              name: 'framer-motion',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 30,
            },
            // Commons chunk for shared code
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            // Lib chunk for other node_modules
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'lib',
              priority: 10,
            },
          },
        },
      };
    }
    return config;
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
};

export default nextConfig;
