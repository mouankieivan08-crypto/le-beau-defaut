/**
 * Charte Le Beau Défaut, version vidéo.
 * Les valeurs reprennent celles du site (src/app/globals.css et src/lib/logo-geometry.ts).
 */
export { SERIF, SANS, SCRIPT } from "./fonts";

export const C = {
  cream: "#FAF5EC",
  creamDeep: "#F2E9DA",
  linen: "#FFFDF8",
  sand: "#E7DCCB",
  brown: "#6B5647",
  brownLight: "#EFE5D8",
  ink: "#14110E",
  inkSoft: "#3D342C",
  muted: "#7A6A5A",
  arc: "#C9B9AE",
  gold: "#C9A227",
  goldDeep: "#8C6A24",
  goldPale: "#F3E6C2",
  gradeA: "#276B4E",
  gradeB: "#7D5E1F",
  gradeC: "#A34E2D",
  whatsapp: "#25D366",
};

export const GOLD_STOPS = ["#A97F22", "#D8B24A", "#F2E0A6", "#C9A227"];

// ------------------------------------------------------------ logo

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

export const SWOOSH =
  "M0,30 C14,27 34,19 56,9 C69,3 82,0 98,0 C84,7 67,15 49,23 C33,30 15,34 0,30 Z M12,37 C30,35 50,29 72,19 C58,31 35,39 15,39 Z";

/** Aligne L, B, D sur une ligne de base commune. */
export function letterPaths(cap: number, baseline: number, centerX: number, tracking = 0.09) {
  const items = (["L", "B", "D"] as const).map((k) => {
    const g = GLYPH[k];
    const scale = cap / (g.y1 - g.y0);
    return { k, g, scale, width: (g.x1 - g.x0) * scale };
  });
  const gap = cap * tracking;
  const total = items.reduce((t, i) => t + i.width, 0) + gap * 2;
  let pen = centerX - total / 2;
  const paths = items.map((it) => {
    const tx = pen - it.g.x0 * it.scale;
    const ty = baseline - it.g.y1 * it.scale;
    pen += it.width + gap;
    return { key: it.k, d: it.g.d, transform: `translate(${tx} ${ty}) scale(${it.scale})` };
  });
  return { paths, left: centerX - total / 2, right: centerX + total / 2 };
}

/** Arc de cercle entre deux angles (degrés, 0 = est, sens horaire). */
export function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  };
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${p(from)} A${r},${r} 0 ${large} 1 ${p(to)}`;
}

export const money = (n: number) => `${n.toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;
export const num = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ");
