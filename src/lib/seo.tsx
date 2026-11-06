/**
 * Référencement : les données structurées (schema.org) que Google lit pour comprendre
 * qui vend quoi, à quel prix et dans quel état — et pour afficher prix et disponibilité
 * directement dans ses résultats.
 */
import { BRAND, DEPOSIT_NUMBERS } from "./constants";
import { siteUrl } from "./site";

/** Insère un bloc JSON-LD dans la page. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Le JSON est produit par nous seuls ; « < » est neutralisé pour ne jamais fermer la balise.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const telephone = `+242${DEPOSIT_NUMBERS[0].raw}`;

/** L'entreprise : nom, logo, contact, zone desservie. */
export function organizationLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}/#organisation`,
    name: BRAND.name,
    url,
    logo: `${url}/icons/icon-512.png`,
    slogan: BRAND.tagline,
    description:
      "Le Beau Défaut vend à Brazzaville du mobilier neuf, invendu ou présentant un léger défaut : chaque défaut est contrôlé, photographié et annoncé, le prix est ajusté en conséquence.",
    email: BRAND.email,
    telephone,
    areaServed: { "@type": "City", name: "Brazzaville" },
    address: { "@type": "PostalAddress", addressLocality: "Brazzaville", addressCountry: "CG" },
    contactPoint: {
      "@type": "ContactPoint",
      telephone,
      email: BRAND.email,
      contactType: "customer service",
      areaServed: "CG",
      availableLanguage: ["French"],
    },
  };
}

/** Le site et sa recherche : Google peut proposer un champ de recherche sous le résultat. */
export function websiteLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#site`,
    name: BRAND.name,
    url,
    inLanguage: "fr",
    publisher: { "@id": `${url}/#organisation` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${url}/catalogue?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

type ProductForLd = {
  slug: string;
  reference: string;
  title: string;
  description: string;
  defectSummary: string;
  defectGrade: string;
  price: number;
  priceOriginal: number;
  quantity: number;
  status: string;
  brand: string | null;
  material: string | null;
  color: string | null;
  images: { url: string }[];
  category: { name: string; slug: string };
  reviews: { rating: number }[];
};

/**
 * Un article. Les produits sont neufs ; un grade A (défaut discret, fin de série,
 * emballage) reste « neuf », un défaut visible ou marqué est déclaré comme tel :
 * mieux vaut un acheteur prévenu qu'un acheteur déçu.
 */
export function productLd(p: ProductForLd) {
  const url = siteUrl();
  const pageUrl = `${url}/produit/${p.slug}`;
  const inStock = p.status === "PUBLIE" && p.quantity > 0;
  const priceValidUntil = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#article`,
    name: p.title,
    sku: p.reference,
    url: pageUrl,
    image: p.images.map((i) => i.url).slice(0, 6),
    description: `${p.description} Défaut annoncé : ${p.defectSummary}`,
    category: p.category.name,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(p.material ? { material: p.material } : {}),
    ...(p.color ? { color: p.color } : {}),
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "XAF",
      price: p.price,
      priceValidUntil,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: p.defectGrade === "A" ? "https://schema.org/NewCondition" : "https://schema.org/DamagedCondition",
      seller: { "@id": `${url}/#organisation` },
      areaServed: { "@type": "City", name: "Brazzaville" },
    },
  };

  if (p.reviews.length > 0) {
    const avg = p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length;
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: p.reviews.length };
  }
  return ld;
}

/** Fil d'Ariane, affiché par Google à la place de l'adresse brute. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${url}${it.path}`,
    })),
  };
}
