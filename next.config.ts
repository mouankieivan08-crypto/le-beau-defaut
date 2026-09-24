import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Une requête Vercel est plafonnée à 4,5 Mo ; les photos sont allégées côté navigateur.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },

  /** En-têtes de sécurité appliqués à toutes les pages. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
