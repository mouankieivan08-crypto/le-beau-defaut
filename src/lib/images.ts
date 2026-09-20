/**
 * Les connexions mobiles congolaises sont chères et lentes : on ne télécharge jamais
 * une image plus grande que la place qu'elle occupe à l'écran.
 *
 * Les photos de démonstration viennent d'un service qui sait redimensionner à la volée
 * (paramètre `w`). Les photos téléversées par les vendeurs sont servies telles quelles.
 */
export function sized(url: string | null | undefined, width: number): string {
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) return url; // fichier local /uploads/...
  try {
    const u = new URL(url);
    if (!u.searchParams.has("w")) return url;
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", u.searchParams.get("q") ?? "72");
    if (u.searchParams.has("h")) {
      const ratio = Number(u.searchParams.get("h")) / Number(u.searchParams.get("w") ?? width);
      if (Number.isFinite(ratio) && ratio > 0) u.searchParams.set("h", String(Math.round(width * ratio)));
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** Jeu de sources pour les écrans à forte densité (2×), sans dépasser le nécessaire. */
export function srcSet(url: string | null | undefined, width: number): string | undefined {
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  const one = sized(url, width);
  const two = sized(url, width * 2);
  return one === url && two === url ? undefined : `${one} 1x, ${two} 2x`;
}
