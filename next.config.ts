import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React strict mode to prevent double-renders during OAuth callback
  // TODO: Re-enable when OAuth callback handling is improved
  reactStrictMode: false,

  // Image optimization configuration
  // SECURITY: Only allow images from our specific Supabase project
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bexzgttfmscdvgfvketp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Note: Removed wildcard '*.supabase.co' pattern for security
      // Only our specific project hostname is allowed
    ],
  },

  // Security headers configuration
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            // Prevent clickjacking attacks
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Enable XSS filter (legacy browsers)
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Control referrer information
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Restrict browser features
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Prevent DNS prefetching to protect privacy
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        // Additional headers for API routes
        source: '/api/:path*',
        headers: [
          {
            // Prevent caching of API responses with sensitive data
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
