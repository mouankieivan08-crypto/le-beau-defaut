/**
 * Fabrique tous les fichiers du logo à partir d'une seule source : src/lib/logo-geometry.ts.
 *
 *   npx tsx scripts/export-brand.ts
 *
 * Produit les SVG de marque, le favicon, l'icône iPhone, les icônes d'installation
 * Android et les PNG de présentation. À relancer dès que le dessin change.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";
import {
  BRAND_COLORS as C,
  LOCKUP,
  LOCKUP_BOX,
  MARK,
  MARK_BOX,
  letterPaths,
  ringArcs,
  swooshPath,
} from "../src/lib/logo-geometry";

// Polices embarquées (sous-ensemble latin, licence SIL Open Font) : les fichiers
// s'affichent à l'identique partout, même sans les polices installées.
const b64 = (f: string) => readFileSync(`scripts/fonts/${f}`).toString("base64");
const FONTS = `<style>
@font-face{font-family:'LBD Display';font-style:normal;font-weight:600;src:url(data:font/woff2;base64,${b64("playfair-600-latin.woff2")}) format('woff2');}
@font-face{font-family:'LBD Script';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${b64("parisienne-latin.woff2")}) format('woff2');}
</style>`;

const serif = `font-family="LBD Display, 'Playfair Display', Didot, 'Times New Roman', serif"`;
const script = `font-family="LBD Script, Parisienne, 'Segoe Script', cursive"`;

const gold = (id: string) =>
  `<linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">${C.goldStops
    .map((c, i) => `<stop offset="${((i / (C.goldStops.length - 1)) * 100).toFixed(0)}%" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;

/** Le monogramme : arcs, lettres, coup de pinceau. */
function monogram({ ink, arc, id }: { ink: string; arc: string; id: string }) {
  const { paths, right } = letterPaths(MARK.letters);
  const brush = swooshPath({ x: right - MARK.letters.cap * MARK.swoosh.back, y: MARK.swoosh.y, w: MARK.letters.cap * MARK.swoosh.width });
  return `<g fill="none" stroke="${arc}" stroke-width="1.8" stroke-linecap="round">${ringArcs(MARK.ring)
    .map((d) => `<path d="${d}"/>`)
    .join("")}</g>${paths
    .map((p) => `<path d="${p.d}" transform="${p.transform}" fill="${ink}" fill-rule="evenodd"/>`)
    .join("")}<path d="${brush.d}" transform="${brush.transform}" fill="url(#${id})"/>`;
}

/** La composition complète, filet et nom compris. */
function lockup({ ink, arc, rule, id }: { ink: string; arc: string; rule: string; id: string }) {
  const { paths, right } = letterPaths(LOCKUP.letters);
  const brush = swooshPath({ x: right - LOCKUP.letters.cap * LOCKUP.swoosh.back, y: LOCKUP.swoosh.y, w: LOCKUP.letters.cap * LOCKUP.swoosh.width });
  return `<g fill="none" stroke="${arc}" stroke-width="1.8" stroke-linecap="round">${ringArcs(LOCKUP.ring)
    .map((d) => `<path d="${d}"/>`)
    .join("")}</g>${paths
    .map((p) => `<path d="${p.d}" transform="${p.transform}" fill="${ink}" fill-rule="evenodd"/>`)
    .join("")}<path d="${brush.d}" transform="${brush.transform}" fill="url(#${id})"/>
  <rect x="${LOCKUP.rule.x}" y="${LOCKUP.rule.y}" width="${LOCKUP.rule.w}" height="1" fill="${rule}"/>
  <text x="${LOCKUP.word.x}" y="${LOCKUP.word.y}" text-anchor="middle" ${serif} font-size="${LOCKUP.word.size}" font-weight="600" letter-spacing="1.2" fill="${ink}" style="font-variant:small-caps">Le Beau Défaut</text>`;
}

const svg = (viewBox: string, w: number, h: number, body: string, withFonts = false) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${w}" height="${h}">${
    withFonts ? FONTS : ""
  }<defs>${gold("or")}</defs>${body}</svg>`;

const markSvg = (dark: boolean, background?: string) =>
  svg(
    `0 0 ${MARK_BOX} ${MARK_BOX}`,
    1024,
    1024,
    `${background ? `<rect width="${MARK_BOX}" height="${MARK_BOX}" fill="${background}"/>` : ""}${monogram({
      ink: dark ? C.brownLight : C.brown,
      arc: dark ? C.arcOnDark : C.arc,
      id: "or",
    })}`
  );

const lockupSvg = (dark: boolean, background?: string) =>
  svg(
    `0 0 ${LOCKUP_BOX.w} ${LOCKUP_BOX.h}`,
    1200,
    1000,
    `${background ? `<rect width="${LOCKUP_BOX.w}" height="${LOCKUP_BOX.h}" fill="${background}"/>` : ""}${lockup({
      ink: dark ? C.brownLight : C.brown,
      arc: dark ? C.arcOnDark : C.arc,
      rule: dark ? C.ruleOnDark : C.rule,
      id: "or",
    })}`,
    true
  );

/** Logo horizontal : monogramme à gauche, nom à droite. */
const horizontalSvg = (dark: boolean) => {
  const ink = dark ? C.brownLight : C.brown;
  const arc = dark ? C.arcOnDark : C.arc;
  return svg(
    "0 0 470 120",
    1410,
    360,
    `${dark ? `<rect width="470" height="120" fill="${C.ink}"/>` : ""}
    <g transform="translate(0 0)">${monogram({ ink, arc, id: "or" })}</g>
    <text x="134" y="74" ${serif} font-size="30" font-weight="600" letter-spacing="1.4" fill="${ink}" style="font-variant:small-caps">Le Beau Défaut</text>`,
    true
  );
};

/** Version signée, pour les documents. */
const signatureSvg = (dark: boolean) =>
  svg(
    `0 0 ${LOCKUP_BOX.w} 250`,
    1200,
    1250,
    `<rect width="${LOCKUP_BOX.w}" height="250" fill="${dark ? C.ink : C.cream}"/>${lockup({
      ink: dark ? C.brownLight : C.brown,
      arc: dark ? C.arcOnDark : C.arc,
      rule: dark ? C.ruleOnDark : C.rule,
      id: "or",
    })}
    <text x="120" y="195" text-anchor="middle" ${script} font-size="15" fill="${dark ? "#D8B35F" : "#A8802F"}">Les petits défauts font</text>
    <text x="120" y="218" text-anchor="middle" ${script} font-size="15" fill="${dark ? "#D8B35F" : "#A8802F"}">de grandes économies</text>`,
    true
  );

// ---------------------------------------------------------------- écriture

mkdirSync("public/brand", { recursive: true });
mkdirSync("public/icons", { recursive: true });

const files: Record<string, string> = {
  "lbd-monogramme.svg": markSvg(false),
  "lbd-monogramme-sombre.svg": markSvg(true, C.ink),
  "lbd-logo-horizontal.svg": horizontalSvg(false),
  "lbd-logo-horizontal-sombre.svg": horizontalSvg(true),
  "lbd-logo-complet.svg": signatureSvg(false),
  "lbd-logo-complet-sombre.svg": signatureSvg(true),
};

for (const [name, content] of Object.entries(files)) {
  writeFileSync(`public/brand/${name}`, content.replace(/\n\s+/g, "\n"));
  console.log("écrit public/brand/" + name);
}

// Favicon SVG : le monogramme sur ivoire, coins arrondis.
const faviconSvg = svg(
  `0 0 ${MARK_BOX} ${MARK_BOX}`,
  120,
  120,
  `<rect width="${MARK_BOX}" height="${MARK_BOX}" rx="26" fill="${C.cream}"/>${monogram({
    ink: C.brown,
    arc: C.arc,
    id: "or",
  })}`
);
writeFileSync("src/app/icon.svg", faviconSvg);
console.log("écrit src/app/icon.svg");

/** Le même dessin, mais avec de la marge : Android rogne les angles des icônes. */
const maskableSvg = svg(
  `0 0 ${MARK_BOX} ${MARK_BOX}`,
  512,
  512,
  `<rect width="${MARK_BOX}" height="${MARK_BOX}" fill="${C.cream}"/><g transform="translate(60 60) scale(0.68) translate(-60 -60)">${monogram(
    { ink: C.brown, arc: C.arc, id: "or" }
  )}</g>`
);

const png = (source: string, size: number) =>
  sharp(Buffer.from(source)).resize(size, size, { fit: "contain" }).png({ compressionLevel: 9 }).toBuffer();

const raster: [string, string, number][] = [
  ["public/icons/icon-192.png", faviconSvg, 192],
  ["public/icons/icon-512.png", faviconSvg, 512],
  ["public/icons/maskable-512.png", maskableSvg, 512],
  ["src/app/apple-icon.png", faviconSvg, 180],
  ["public/brand/lbd-monogramme.png", markSvg(false, C.cream), 1024],
  ["public/brand/lbd-monogramme-sombre.png", markSvg(true, C.ink), 1024],
];

for (const [path, source, size] of raster) {
  writeFileSync(path, await png(source, size));
  console.log(`écrit ${path} (${size} px)`);
}

// Les logos larges, rasterisés à leur proportion d'origine.
for (const [path, source, width] of [
  ["public/brand/lbd-logo-horizontal.png", horizontalSvg(false), 1410],
  ["public/brand/lbd-logo-horizontal-sombre.png", horizontalSvg(true), 1410],
  ["public/brand/lbd-logo-complet.png", signatureSvg(false), 1200],
  ["public/brand/lbd-logo-complet-sombre.png", signatureSvg(true), 1200],
] as [string, string, number][]) {
  writeFileSync(path, await sharp(Buffer.from(source)).resize({ width }).png({ compressionLevel: 9 }).toBuffer());
  console.log(`écrit ${path}`);
}

/**
 * favicon.ico : certains navigateurs et les aperçus de lien le réclament à la racine,
 * sans jamais lire le SVG. Un .ico peut contenir directement des PNG.
 */
const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map((s) => png(faviconSvg, s)));
const header = Buffer.alloc(6 + 16 * icoSizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
let offset = header.length;
icoSizes.forEach((s, i) => {
  const at = 6 + i * 16;
  header.writeUInt8(s === 256 ? 0 : s, at);
  header.writeUInt8(s === 256 ? 0 : s, at + 1);
  header.writeUInt8(0, at + 2);
  header.writeUInt8(0, at + 3);
  header.writeUInt16LE(1, at + 4);
  header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(icoImages[i].length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += icoImages[i].length;
});
writeFileSync("public/favicon.ico", Buffer.concat([header, ...icoImages]));
console.log("écrit public/favicon.ico (16, 32, 48 px)");
