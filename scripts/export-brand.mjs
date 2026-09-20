// Génère les fichiers du logo (SVG autonomes, polices intégrées) à partir des
// tracés de src/components/Logo.tsx.
// Usage : node scripts/export-brand.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync("src/components/Logo.tsx", "utf8");
const grab = (key) => {
  const marker = `  ${key}: "`;
  const start = src.indexOf(marker) + marker.length;
  return src.slice(start, src.indexOf('"', start));
};
const P = { L: grab("L"), B: grab("B"), D: grab("D"), star: grab("star") };
const T = JSON.parse(src.match(/export const T = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));

const INK = "#14110E";
const CREAM = "#FAF5EC";
const GOLD = ["#8C6A24", "#C9A227", "#F0DCA0", "#C9A227", "#8C6A24"];
const stops = GOLD.map((c, i) => `<stop offset="${(i / 4) * 100}%" stop-color="${c}"/>`).join("");

// Polices embarquées (sous-ensemble latin, licence SIL Open Font) : le fichier
// s'affiche identiquement partout, même sans les polices installées.
const b64 = (f) => readFileSync(`scripts/fonts/${f}`).toString("base64");
const FONTS = `<style>
@font-face{font-family:'LBD Display';font-style:normal;font-weight:600;src:url(data:font/woff2;base64,${b64("playfair-600-latin.woff2")}) format('woff2');}
@font-face{font-family:'LBD Script';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${b64("parisienne-latin.woff2")}) format('woff2');}
</style>`;

let uid = 0;

/**
 * Le liseré qui sépare les lettres est une vraie découpe (masque), pas un trait
 * peint : le logo reste net sur n'importe quel fond, y compris transparent.
 */
function monogram({ ink, x = 0, y = 0, scale = 1 }) {
  const id = `m${++uid}`;
  const cut = (d, transform, maskId) => `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
      <rect x="-20" y="-20" width="140" height="140" fill="white"/>
      <path d="${d}" transform="${transform}" fill="black" fill-rule="evenodd" stroke="black" stroke-width="3.2" stroke-linejoin="round"/>
    </mask>`;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    ${cut(P.B, T.B, `${id}-cutB`)}
    ${cut(P.D, T.D, `${id}-cutD`)}
    <path d="${P.L}" fill="${ink}" transform="${T.L}" mask="url(#${id}-cutB)"/>
    <path d="${P.B}" transform="${T.B}" fill="url(#gold)" fill-rule="evenodd" mask="url(#${id}-cutD)"/>
    <path d="${P.D}" transform="${T.D}" fill="${ink}" fill-rule="evenodd"/>
    <path d="${P.star}" fill="url(#gold)" transform="${T.star}"/>
  </g>`;
}
const defs = `<defs><linearGradient id="gold" x1="20" y1="18" x2="80" y2="92" gradientUnits="userSpaceOnUse">${stops}</linearGradient><linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>`;
const font = `font-family="LBD Display, 'Playfair Display', Didot, 'Times New Roman', serif"`;
const script = `font-family="LBD Script, Parisienne, 'Segoe Script', cursive"`;

const horizontal = (ink, knockout) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 110" width="1560" height="330">${FONTS}${defs}${monogram(
    { ink, knockout, x: 5, y: 5 }
  )}<text x="122" y="70" ${font} font-size="38" font-weight="600" letter-spacing="2.6" fill="${ink}">LE BEAU DÉFAUT</text></svg>`;

const complet = (ink, knockout, background) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 560" width="1200" height="1120">${FONTS}${defs}
  ${background ? `<rect width="600" height="560" fill="${background}"/>` : ""}
  ${monogram({ ink, knockout, x: 190, y: 20, scale: 2.2 })}
  <text x="300" y="320" text-anchor="middle" ${font} font-size="50" font-weight="600" letter-spacing="4" fill="${ink}">LE BEAU DÉFAUT</text>
  <rect x="120" y="352" width="160" height="1.6" fill="url(#goldH)"/><rect x="320" y="352" width="160" height="1.6" fill="url(#goldH)"/>
  <path transform="translate(288 341)" d="M12 2c.9 6.4 2.6 8.1 9 9-6.4.9-8.1 2.6-9 9-.9-6.4-2.6-8.1-9-9 6.4-.9 8.1-2.6 9-9Z" fill="#B8913C"/>
  <text x="300" y="425" text-anchor="middle" ${script} font-size="46" fill="${background ? "#A8802F" : "#D8B35F"}">Les petits défauts font</text>
  <text x="300" y="485" text-anchor="middle" ${script} font-size="46" fill="${background ? "#A8802F" : "#D8B35F"}">de grandes économies</text></svg>`;

const files = {
  // Monogramme seul, fond transparent
  "lbd-monogramme.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 0 116 104" width="1024" height="918">${defs}${monogram({ ink: INK })}</svg>`,
  // Monogramme pour fond sombre (lettres ivoire), fond noir inclus
  "lbd-monogramme-sombre.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 0 116 104" width="1024" height="918">${defs}<rect x="-4" y="0" width="116" height="104" fill="${INK}"/>${monogram({ ink: CREAM })}</svg>`,
  // Logo horizontal (en-tête de site, facture, tampon), fond transparent
  "lbd-logo-horizontal.svg": horizontal(INK, CREAM),
  "lbd-logo-horizontal-sombre.svg": horizontal(CREAM, INK),
  // Logo complet avec signature
  "lbd-logo-complet.svg": complet(INK, CREAM, CREAM),
  "lbd-logo-complet-sombre.svg": complet(CREAM, INK, INK),
};

mkdirSync("public/brand", { recursive: true });
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(`public/brand/${name}`, svg.replace(/\n\s+/g, "\n"));
  console.log("écrit", `public/brand/${name}`);
}

// Icône de l'application (favicon) : monogramme sur ivoire, coins arrondis
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}<rect width="100" height="100" rx="22" fill="${CREAM}"/>${monogram({ ink: INK, knockout: CREAM, x: 7, y: 7, scale: 0.86 })}</svg>`;
writeFileSync("src/app/icon.svg", icon.replace(/\n\s+/g, "\n"));
console.log("écrit src/app/icon.svg");
