import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/command-center",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/command-center/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
