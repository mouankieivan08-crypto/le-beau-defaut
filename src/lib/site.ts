/** Adresse publique du site, utilisée par le plan du site, les liens de partage et les métadonnées. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
