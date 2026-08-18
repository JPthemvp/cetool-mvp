import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the page being embedded in iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers sniffing MIME types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't send referrer to cross-origin destinations
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limit browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Force HTTPS for 1 year (Vercel adds this too, belt-and-suspenders)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Basic XSS protection for older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
];

const nextConfig: NextConfig = {
  // A stray lockfile in the user profile makes Next infer the wrong workspace root.
  outputFileTracingRoot: import.meta.dirname,

  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
