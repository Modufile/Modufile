import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable turbopack (Next 16 uses it by default)
  turbopack: {},

  // Static export for Cloudflare Pages
  output: 'export',

  // Required for ffmpeg.wasm SharedArrayBuffer support
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

  // Webpack config (only used when not using turbopack)
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
};

export default nextConfig;
