import type { NextConfig } from "next";

// Extract the Supabase project hostname from NEXT_PUBLIC_SUPABASE_URL if provided.
// e.g. "https://abcdef.supabase.co" → "abcdef.supabase.co"
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  // Compile workspace packages (they ship TypeScript source directly)
  transpilePackages: ["@zari/shared-types", "@zari/shared-utils", "@zari/shared-validation"],
  images: {
    remotePatterns: [
      // ── Supabase Storage (production) ─────────────────────────────────────
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/**",
      },
      // ── Cloudflare R2 (legacy) ────────────────────────────────────────────
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.cloudflare.com" },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_R2_HOSTNAME || "assets.yourdomain.com",
      },
      // ── Local backend uploads (development) ───────────────────────────────
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      // ── Stock images used for dev placeholders ────────────────────────────
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};

export default nextConfig;
