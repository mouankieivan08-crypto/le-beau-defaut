/**
 * Polices de la marque, embarquées dans le projet (public/fonts) : le rendu ne dépend
 * ni d'Internet ni des polices installées sur la machine.
 */
import { continueRender, delayRender, staticFile } from "remotion";

const FACES: { family: string; file: string; weight: string; style?: string }[] = [
  { family: "LBD Serif", file: "playfair-600-latin.woff2", weight: "600" },
  { family: "LBD Serif", file: "playfair-display-700.woff2", weight: "700" },
  { family: "LBD Serif", file: "playfair-display-600-italic.woff2", weight: "600", style: "italic" },
  { family: "LBD Serif", file: "playfair-display-700-italic.woff2", weight: "700", style: "italic" },
  { family: "LBD Sans", file: "inter-500.woff2", weight: "500" },
  { family: "LBD Sans", file: "inter-600.woff2", weight: "600" },
  { family: "LBD Sans", file: "inter-700.woff2", weight: "700" },
  { family: "LBD Sans", file: "inter-800.woff2", weight: "800" },
  { family: "LBD Script", file: "parisienne-latin.woff2", weight: "400" },
];

if (typeof document !== "undefined") {
  const handle = delayRender("Chargement des polices Le Beau Défaut");
  Promise.all(
    FACES.map((f) => {
      const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format("woff2")`, {
        weight: f.weight,
        style: f.style ?? "normal",
      });
      return face.load().then((loaded) => document.fonts.add(loaded));
    })
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

export const SERIF = "'LBD Serif', 'Playfair Display', Georgia, serif";
export const SANS = "'LBD Sans', Inter, 'Segoe UI', Arial, sans-serif";
export const SCRIPT = "'LBD Script', Parisienne, cursive";
