/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Experimental settings: configure Server Actions body size limit
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },

  // Security headers for HSDC application
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy (includes Vercel analytics domains)
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: blob:; " +
              "font-src 'self' data:; " +
              "connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com; " +
              "form-action 'self'; " +
              "frame-ancestors 'none'; " +
              "object-src 'none';",
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HSTS (only in production)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 
              'accelerometer=(), ' +
              'camera=(), ' +
              'geolocation=(), ' +
              'gyroscope=(), ' +
              'magnetometer=(), ' +
              'microphone=(), ' +
              'payment=(), ' +
              'usb=()',
          },
        ],
      },
      // API routes should have stricter CSP
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self';",
          },
        ],
      },
    ]
  },
}

export default nextConfig
