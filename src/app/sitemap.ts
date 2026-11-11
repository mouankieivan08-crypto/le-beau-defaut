import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { PUBLISHED } from "@/lib/queries";
import { VISIBLE_VERTICALS } from "@/lib/constants";

// Le plan du site lit la base : on le genere a la demande, pas au build.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

/** Plan du site : ce que Google doit indexer. Les espaces privés en sont exclus. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticPages = [
    { path: "", priority: 1, freq: "daily" as const },
    { path: "catalogue", priority: 0.9, freq: "daily" as const },
    { path: "le-defaut", priority: 0.7, freq: "monthly" as const },
    { path: "a-propos", priority: 0.5, freq: "monthly" as const },
    { path: "aide", priority: 0.5, freq: "monthly" as const },
    { path: "identite", priority: 0.3, freq: "yearly" as const },
    { path: "conditions", priority: 0.4, freq: "yearly" as const },
    { path: "confidentialite", priority: 0.4, freq: "yearly" as const },
    { path: "mentions-legales", priority: 0.3, freq: "yearly" as const },
  ].map((p) => ({
    url: `${base}/${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.freq,
    priority: p.priority,
  }));

  // Seuls les articles réellement visibles sont proposés à Google : un article d'un
  // univers fermé, listé ici, deviendrait une page introuvable dans ses résultats.
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: PUBLISHED,
      select: { slug: true, updatedAt: true, images: { where: { isCover: true }, select: { url: true }, take: 1 } },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    }),
    prisma.category.findMany({
      where: { isActive: true, vertical: { in: VISIBLE_VERTICALS }, products: { some: PUBLISHED } },
      select: { slug: true },
    }),
  ]);

  return [
    ...staticPages,
    ...products.map((p) => ({
      url: `${base}/produit/${p.slug}`,
      images: p.images.map((i) => i.url),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map((c) => ({
      url: `${base}/catalogue?categorie=${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
