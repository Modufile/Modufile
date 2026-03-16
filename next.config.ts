import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages (only in production)
  // In dev, we need the default server to support the headers() function below.
  output: isProd ? 'export' : undefined,
  // Ensure paths match Cloudflare's directory structure (e.g. /about -> /about/index.html)
  trailingSlash: true,

  // Silence Turbopack warning about missing turbopack config
  turbopack: {},

  webpack: (config, { isServer, webpack }) => {
    // Stub Node.js built-ins for client-side builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      canvas: false,
      https: false,
      http: false,
    };

    // Strip `node:` URI prefix so fallbacks above can handle them
    // (pptxgenjs imports node:fs, node:https)
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );

    // Enable WASM support for mupdf and other WASM modules
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Exclude mupdf WASM from being bundled — it's served from public/
    if (!isServer) {
      config.externals = config.externals || [];
    }

    return config;
  },

  // Headers for WASM + SharedArrayBuffer support
  async headers() {
    // In production, Cloudflare uses public/_headers, and Next.js static exports don't support headers()
    if (isProd) return [];

    return [
      {
        source: '/(.*)',
        headers: [
          // Required for SharedArrayBuffer (WASM threading)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      {
        source: '/:path*.wasm',
        headers: [
          // Long-term cache for WASM binaries (immutable content-addressed)
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'application/wasm' },
        ],
      },
    ];
  },
};

export default nextConfig;
