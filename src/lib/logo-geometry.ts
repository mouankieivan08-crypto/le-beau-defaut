/**
 * Géométrie du logo Le Beau Défaut.
 *
 * Un seul endroit décrit le dessin : le composant React et le script qui exporte
 * les fichiers (SVG, favicon, icônes du téléphone) lisent tous les deux ce module.
 * Le jour où le logo bouge, il bouge partout.
 *
 * Le dessin : le monogramme LBD en capitales Didone brunes, traversé au bas du D
 * par un coup de pinceau doré, le tout dans un cercle ouvert sur les côtés.
 */

export const BRAND_COLORS = {
  /** Le brun du monogramme. */
  brown: "#6B5647",
  /** Brun éclairci pour les fonds sombres. */
  brownLight: "#EFE5D8",
  cream: "#FAF5EC",
  ink: "#14110E",
  /** Le fin cercle ouvert. */
  arc: "#C9B9AE",
  arcOnDark: "#8A7565",
  /** Le filet sous le monogramme. */
  rule: "#D8D2CC",
  ruleOnDark: "#4A3F36",
  goldStops: ["#A97F22", "#D8B24A", "#F2E0A6", "#C9A227"],
};

/** Les trois capitales, dessinées à la main, avec leur cadre d'origine. */
export const GLYPH = {
  L: { d: "M4,8 H26 V10.2 H20 V63.8 H37.8 V56 H40 V66 H4 Z", x0: 4, x1: 40, y0: 8, y1: 66 },
  B: {
    d: "M30,24 H45 V24 H53 C62.5,24 67,30 67,37.6 C67,43.6 63.6,48.2 57.6,50.6 C66,52.4 71,58.4 71,66.8 C71,77.6 64.6,84 54.6,84 H30 V81.8 H36 V26.2 H30 Z M45,26.2 V49.8 H52.4 C57.6,49.8 60.2,45.4 60.2,38 C60.2,30.6 57.6,26.2 52.4,26.2 Z M45,52.2 V81.8 H54.2 C60.4,81.8 63.6,76.4 63.6,67 C63.6,57.6 60.4,52.2 54.2,52.2 Z",
    x0: 30,
    x1: 71,
    y0: 24,
    y1: 84,
  },
  D: {
    d: "M51,40 H72 C86,40 94,50.5 94,68 C94,85.5 86,96 72,96 H51 V93.8 H57 V42.2 H51 Z M66.5,42.2 V93.8 H71 C80.5,93.8 85.5,84 85.5,68 C85.5,52 80.5,42.2 71,42.2 Z",
    x0: 51,
    x1: 94,
    y0: 40,
    y1: 96,
  },
} as const;

export type LetterPath = { d: string; transform: string };

/**
 * Aligne L, B et D sur une même ligne de base, à hauteur de capitale égale.
 * Chaque lettre ayant été dessinée à sa propre échelle, on les remet d'aplomb ici.
 */
export function letterPaths({
  cap,
  baseline,
  centerX,
  tracking = 0.09,
}: {
  cap: number;
  baseline: number;
  centerX: number;
  tracking?: number;
}): { paths: LetterPath[]; left: number; right: number } {
  const items = (["L", "B", "D"] as const).map((k) => {
    const g = GLYPH[k];
    const scale = cap / (g.y1 - g.y0);
    return { g, scale, width: (g.x1 - g.x0) * scale };
  });

  const gap = cap * tracking;
  const total = items.reduce((t, i) => t + i.width, 0) + gap * (items.length - 1);
  const left = centerX - total / 2;

  let pen = left;
  const paths = items.map((it) => {
    const tx = pen - it.g.x0 * it.scale;
    const ty = baseline - it.g.y1 * it.scale;
    pen += it.width + gap;
    return { d: it.g.d, transform: `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${it.scale.toFixed(4)})` };
  });

  return { paths, left, right: left + total };
}

/** Le coup de pinceau doré : une traînée qui s'amincit jusqu'à la pointe, plus un éclat dessous. */
export function swooshPath({ x, y, w }: { x: number; y: number; w: number }): LetterPath {
  return {
    d: "M0,30 C14,27 34,19 56,9 C69,3 82,0 98,0 C84,7 67,15 49,23 C33,30 15,34 0,30 Z M12,37 C30,35 50,29 72,19 C58,31 35,39 15,39 Z",
    transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(w / 100).toFixed(4)})`,
  };
}

/** Les deux arcs du cercle, ouverts à gauche et à droite pour laisser passer le filet. */
export function ringArcs({ cx, cy, r }: { cx: number; cy: number; r: number }): string[] {
  const at = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  };
  return [
    `M${at(200)} A${r},${r} 0 0 1 ${at(340)}`,
    `M${at(20)} A${r},${r} 0 0 1 ${at(160)}`,
  ];
}

/**
 * Réglages du monogramme carré (icône, favicon, avatar).
 *
 * Les lettres tiennent dans le cercle avec une marge, et la pointe dorée effleure
 * l'arc de droite sans sortir du cadre — c'est ce qui fait qu'une icône de 32 px
 * reste lisible et qu'aucun bord n'est rogné.
 */
export const MARK_BOX = 120;
export const MARK = {
  ring: { cx: 60, cy: 60, r: 50 },
  letters: { cap: 32, baseline: 72, centerX: 60 },
  /** Position et largeur du coup de pinceau, en proportion de la hauteur de capitale. */
  swoosh: { back: 0.55, width: 1.15, y: 54 },
};

/** Réglages du logo complet, avec filet et signature. */
export const LOCKUP_BOX = { w: 240, h: 200 };
export const LOCKUP = {
  ring: { cx: 120, cy: 96, r: 74 },
  letters: { cap: 47, baseline: 112, centerX: 120 },
  swoosh: { back: 0.55, width: 1.15, y: 87 },
  rule: { x: 18, y: 130, w: 204 },
  word: { x: 120, y: 158, size: 21 },
};
