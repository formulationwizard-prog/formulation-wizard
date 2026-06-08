import type { NextConfig } from "next";

// Security headers — data-flow-exposure-audit-2026-06-08 §C.4.
// CSP ships in REPORT-ONLY mode: violations are reported (browser console) without
// blocking, so we can audit a clean window before moving to an enforcing
// `Content-Security-Policy`. The other headers enforce immediately (low risk).
const cspReportOnly = [
  "default-src 'self'",
  // Next.js runtime needs inline/eval today; tighten with nonces when we move to enforcing.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Supabase (operator data) + websockets for auth/realtime.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Minimum-surface permissions; browsing-topics=() opts out of the Topics API.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
