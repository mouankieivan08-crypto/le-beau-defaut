import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/constants";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Le Beau Défaut propose du mobilier à petit défaut en Congo : chaque défaut est photographié, décrit et noté. Prix raisonnable, transparence totale.",
  keywords: [
    "mobilier Congo",
    "meubles Brazzaville",
    "déstockage mobilier",
    "Le Beau Défaut",
    "seconde main Brazzaville",
  ],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "Mobilier à petit défaut : le petit défaut en moins cher, annoncé en toute transparence.",
    type: "website",
    locale: "fr_CG",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF5EC",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300..700&family=Parisienne&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
