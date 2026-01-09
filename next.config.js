/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   optimizeCss: true, // Temporarily disabled due to CSS parsing error
  // },

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 768],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**'
      }
    ]
  },

  compress: true,

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false
      };
    }

    // Temporarily disable complex webpack optimizations to fix favicon issue
    // if (!dev) {
    //   config.optimization.splitChunks = {
    //     chunks: "all",
    //     maxInitialRequests: 30,
    //     maxAsyncRequests: 30,
    //     cacheGroups: {
    //       vendor: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: "vendors",
    //         chunks: "all",
    //         priority: 10,
    //         maxSize: 244000, // 244KB
    //       },
    //       mui: {
    //         test: /[\\/]node_modules[\\/]@mui[\\/]/,
    //         name: "mui",
    //         chunks: "all",
    //         priority: 20,
    //         maxSize: 200000, // 200KB
    //       },
    //       tiptap: {
    //         test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
    //         name: "tiptap",
    //         chunks: "all",
    //         priority: 20,
    //         maxSize: 300000, // 300KB
    //       },
    //       react: {
    //         test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
    //         name: "react",
    //         chunks: "all",
    //         priority: 30,
    //         maxSize: 150000, // 150KB
    //       },
    //       auth0: {
    //         test: /[\\/]node_modules[\\/]@auth0[\\/]/,
    //         name: "auth0",
    //         chunks: "all",
    //         priority: 25,
    //         maxSize: 100000, // 100KB
    //       },
    //       common: {
    //         name: "common",
    //         minChunks: 2,
    //         chunks: "all",
    //         priority: 5,
    //         reuseExistingChunk: true,
    //         maxSize: 200000, // 200KB
    //       },
    //     },
    //   };

    //   config.optimization.usedExports = true;
    //   config.optimization.sideEffects = false;
    // }

    return config;
  },

  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Content-Type',
            value: 'image/x-icon'
          }
        ]
      },
      {
        source: '/favicon-:size.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          },
          {
            key: 'Content-Type',
            value: 'image/x-icon'
          }
        ]
      },
      {
        source: '/api/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      },
      {
        source: '/api/tile/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=120'
          }
        ]
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/uploadImage',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
