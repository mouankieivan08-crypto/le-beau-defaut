import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/constants";

/** Permet d'ajouter Le Beau Défaut à l'écran d'accueil du téléphone, comme une application. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description:
      "Mobilier à petit défaut : le défaut est annoncé, le prix est ajusté.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF5EC",
    theme_color: "#14110E",
    lang: "fr",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/lbd-monogramme.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Mobilier", url: "/catalogue" },
      { name: "Mes commandes", url: "/compte/commandes" },
    ],
  };
}
