import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/constants";
import { siteUrl } from "@/lib/site";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: BRAND.name,
  title: {
    default: `${BRAND.name} — Meubles neufs à petit défaut à Brazzaville`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Mobilier neuf, invendu ou à léger défaut, jusqu'à 70 % moins cher à Brazzaville. Chaque défaut est contrôlé, photographié et annoncé. Livraison dans tout Brazzaville, paiement par Mobile Money (MTN 06 501 81 83 · Airtel 05 741 12 48).",
  keywords: [
    "Le Beau Défaut",
    "meubles Brazzaville",
    "mobilier Brazzaville",
    "meubles neufs pas chers Brazzaville",
    "déstockage meubles Congo",
    "invendus mobilier",
    "fin de série meubles",
    "canapé Brazzaville",
    "meubles à petit défaut",
    "économie circulaire Congo",
  ],
  category: "shopping",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description:
      "Des meubles neufs à petit défaut, contrôlés et vendus jusqu'à 70 % moins cher à Brazzaville. Le défaut est annoncé, le prix est ajusté.",
    locale: "fr_CG",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "Des meubles neufs à petit défaut, jusqu'à 70 % moins cher à Brazzaville.",
  },
  // Renseigner ici le code fourni par Google Search Console pour prouver la propriété du site.
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
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
      <body>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
