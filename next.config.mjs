import { hostname } from "os";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.google.com",
      },
    ],
  },
};

export default nextConfig;
