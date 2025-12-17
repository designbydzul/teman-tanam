import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React strict mode to prevent double-renders during OAuth callback
  reactStrictMode: false,
};

export default nextConfig;
