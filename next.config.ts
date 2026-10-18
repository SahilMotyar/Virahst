import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    // Item images are content-addressed by slug and rebuilt only via scripts,
    // so let browsers and CDNs keep them for a long time.
    return [
      {
        source: "/items/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
