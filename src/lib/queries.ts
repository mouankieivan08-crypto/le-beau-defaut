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
  prixMin?: string;
  prixMax?: string;
  remiseMin?: string;
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
  if (params.categorie) where.category = { slug: params.categorie };

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

/** Compteurs utilisés par les filtres du catalogue. */
export async function facets(params: CatalogueParams) {
  const base = buildProductWhere({ ...params, grade: undefined, ville: undefined });
  const [byGrade, byCity] = await Promise.all([
    prisma.product.groupBy({ by: ["defectGrade"], where: base, _count: true }),
    prisma.product.groupBy({ by: ["city"], where: base, _count: true }),
  ]);
  return {
    grades: Object.fromEntries(byGrade.map((g) => [g.defectGrade, g._count])) as Record<string, number>,
    cities: byCity.map((c) => ({ city: c.city, count: c._count })).sort((a, b) => b.count - a.count),
  };
}
