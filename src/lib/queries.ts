import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

/** Sélection partagée par toutes les vitrines (grilles de cartes). */
export const cardSelect = {
  id: true,
  slug: true,
  title: true,
  price: true,
  priceOriginal: true,
  discountPct: true,
  defectGrade: true,
  defectSummary: true,
  city: true,
  quartier: true,
  vertical: true,
  saleMode: true,
  authenticity: true,
  quantity: true,
  isFlashDeal: true,
  publishedAt: true,
  images: {
    where: { isCover: true },
    select: { url: true, alt: true },
    take: 1,
  },
  category: { select: { name: true, slug: true } },
  seller: { select: { seller: { select: { shopName: true, shopSlug: true } } } },
} satisfies Prisma.ProductSelect;

export const PUBLISHED = { status: "PUBLIE" as const };

/** Identifiants des articles favoris d'un utilisateur (pour colorer les cœurs). */
export async function favoriteIds(userId?: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const favs = await prisma.favorite.findMany({ where: { userId }, select: { productId: true } });
  return new Set(favs.map((f) => f.productId));
}

export type CatalogueParams = {
  q?: string;
  vertical?: string;
  categorie?: string;
  grade?: string;
  ville?: string;
  quartier?: string;
  /** MAISON = vendu par Le Beau Défaut · PARTICULIER = mise en relation */
  circuit?: string;
  marque?: string;
  boutique?: string;
  prixMin?: string;
  prixMax?: string;
  remiseMin?: string;
  /** « 1 » pour n'afficher que les sacs authentifiés par nos soins */
  authentifie?: string;
  /** « 1 » pour n'afficher que les articles au prix négociable */
  negociable?: string;
  /** « 1 » pour écarter les articles à retirer sur place */
  livrable?: string;
  tri?: string;
  page?: string;
};

export const SORTS: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  recent: { publishedAt: "desc" },
  prix_asc: { price: "asc" },
  prix_desc: { price: "desc" },
  remise: { discountPct: "desc" },
  populaire: { views: "desc" },
};

export const SORT_LABELS: Record<string, string> = {
  recent: "Plus récents",
  remise: "Meilleures remises",
  prix_asc: "Prix croissant",
  prix_desc: "Prix décroissant",
  populaire: "Les plus vus",
};

export const PAGE_SIZE = 16;

export function buildProductWhere(params: CatalogueParams): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { ...PUBLISHED };

  if (params.vertical) where.vertical = params.vertical;
  if (params.grade) where.defectGrade = params.grade;
  if (params.ville) where.city = params.ville;
  if (params.quartier) where.quartier = params.quartier;
  if (params.circuit) where.saleMode = params.circuit;
  if (params.marque) where.brand = params.marque;
  if (params.boutique) where.seller = { seller: { shopSlug: params.boutique } };
  if (params.categorie) where.category = { slug: params.categorie };
  if (params.authentifie === "1") where.authenticity = "AUTHENTIFIE_LBD";
  if (params.negociable === "1") where.negotiable = true;
  if (params.livrable === "1") where.pickupOnly = false;

  const min = Number(params.prixMin);
  const max = Number(params.prixMax);
  if (Number.isFinite(min) && min > 0) where.price = { ...(where.price as object), gte: min };
  if (Number.isFinite(max) && max > 0) where.price = { ...(where.price as object), lte: max };

  const remise = Number(params.remiseMin);
  if (Number.isFinite(remise) && remise > 0) where.discountPct = { gte: remise };

  const q = params.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { defectSummary: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

/** Recherche paginée du catalogue. */
export async function searchProducts(params: CatalogueParams) {
  const where = buildProductWhere(params);
  const page = Math.max(1, Number(params.page) || 1);
  const orderBy = SORTS[params.tri ?? "recent"] ?? SORTS.recent;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: cardSelect,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/**
 * Compteurs affichés à côté de chaque filtre.
 *
 * Un critère ne se compte jamais lui-même : sinon, cocher « grade B » ferait tomber
 * les autres grades à zéro et l'acheteur ne saurait plus ce qu'il rate.
 */
export async function facets(params: CatalogueParams) {
  const sansGrade = buildProductWhere({ ...params, grade: undefined });
  const sansQuartier = buildProductWhere({ ...params, quartier: undefined });
  const sansCircuit = buildProductWhere({ ...params, circuit: undefined });
  const sansMarque = buildProductWhere({ ...params, marque: undefined });
  const sansUnivers = buildProductWhere({ ...params, vertical: undefined, categorie: undefined });
  const sansOptions = buildProductWhere({ ...params, authentifie: undefined, negociable: undefined, livrable: undefined });

  const [byGrade, byCity, byQuartier, byCircuit, byBrand, byVertical, authCount, negoCount, deliverCount] =
    await Promise.all([
      prisma.product.groupBy({ by: ["defectGrade"], where: sansGrade, _count: true }),
      prisma.product.groupBy({ by: ["city"], where: sansQuartier, _count: true }),
      prisma.product.groupBy({ by: ["quartier"], where: sansQuartier, _count: true }),
      prisma.product.groupBy({ by: ["saleMode"], where: sansCircuit, _count: true }),
      prisma.product.groupBy({ by: ["brand"], where: sansMarque, _count: true, orderBy: { _count: { brand: "desc" } }, take: 18 }),
      prisma.product.groupBy({ by: ["vertical"], where: sansUnivers, _count: true }),
      prisma.product.count({ where: { ...sansOptions, authenticity: "AUTHENTIFIE_LBD" } }),
      prisma.product.count({ where: { ...sansOptions, negotiable: true } }),
      prisma.product.count({ where: { ...sansOptions, pickupOnly: false } }),
    ]);

  return {
    grades: Object.fromEntries(byGrade.map((g) => [g.defectGrade, g._count])) as Record<string, number>,
    cities: byCity.map((c) => ({ city: c.city, count: c._count })).sort((a, b) => b.count - a.count),
    quartiers: byQuartier
      .filter((q) => q.quartier)
      .map((q) => ({ quartier: q.quartier as string, count: q._count }))
      .sort((a, b) => b.count - a.count),
    circuits: Object.fromEntries(byCircuit.map((c) => [c.saleMode, c._count])) as Record<string, number>,
    brands: byBrand
      .filter((b) => b.brand)
      .map((b) => ({ brand: b.brand as string, count: b._count }))
      .sort((a, b) => b.count - a.count || a.brand!.localeCompare(b.brand!)),
    verticals: Object.fromEntries(byVertical.map((v) => [v.vertical, v._count])) as Record<string, number>,
    options: { authentifie: authCount, negociable: negoCount, livrable: deliverCount },
  };
}

