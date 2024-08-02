import { hostname } from "os";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    domains: ["encrypted-tbn0.gstatic.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.google.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/timeline",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
