/** @type {import('next').NextConfig} */

// next.config.js
// Next.js configuration file for ValnTracker
// Defines global settings for the Next.js application

const nextConfig = {

  // Enable React Strict Mode — helps catch bugs and deprecated patterns during development
  reactStrictMode: true,

  // Expose specific environment variables to the browser (public vars)
  // Note: NEVER expose secret keys here — only use for public/non-sensitive values
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Custom HTTP headers for all routes — improves security posture
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Control referrer information sent with requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Basic XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

};

module.exports = nextConfig;
