import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Include the company logo in server-side export routes.
  // Ensures Vercel bundles the logo for file-system access.
  outputFileTracingIncludes: {
    "/admin/inventory/export": ["./logo/main-logo.svg"],
    "/admin/leads/export": ["./logo/main-logo.svg"],
  },
};

export default nextConfig;
