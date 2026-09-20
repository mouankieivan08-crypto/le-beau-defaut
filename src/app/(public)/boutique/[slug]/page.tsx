import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cardSelect, favoriteIds } from "@/lib/queries";
import { dateFR } from "@/lib/format";
import ProductCard, { ProductGrid } from "@/components/ProductCard";
import Icon from "@/components/Icon";
import { Avatar, Rating, Breadcrumb, EmptyState, Badge } from "@/components/ui";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.sellerProfile.findUnique({ where: { shopSlug: slug }, select: { shopName: true, description: true } });
  return { title: shop?.shopName ?? "Boutique", description: shop?.description ?? undefined };
}

export default async function ShopPublicPage({ params }: Props) {
  const { slug } = await params;
  const shop = await prisma.sellerProfile.findUnique({ where: { shopSlug: slug }, include: { user: { select: { id: true } } } });
  if (!shop || shop.status === "SUSPENDU") notFound();

  const user = await getCurrentUser();
  const [products, sold, reviews] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: shop.userId, status: "PUBLIE" },
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.orderItem.aggregate({ where: { sellerId: shop.userId, order: { status: "LIVREE" } }, _sum: { quantity: true } }),
    prisma.review.findMany({
      where: { product: { sellerId: shop.userId }, isPublished: true },
      select: { defectAsDescribed: true },
    }),
  ]);
  const favs = await favoriteIds(user?.id);
  const conform = reviews.length ? Math.round((reviews.filter((r) => r.defectAsDescribed).length / reviews.length) * 100) : null;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Boutiques" }, { label: shop.shopName }]} />

      <header className="surface p-6 sm:p-8 mb-8 flex flex-col sm:flex-row gap-6 sm:items-center">
        <Avatar first={shop.shopName} last="" url={shop.logoUrl} size={84} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-[30px] font-bold leading-tight">{shop.shopName}</h1>
            {shop.status === "ACTIF" && (
              <Badge tone="success">
                <Icon name="check" size={10} /> Vendeur vérifié
              </Badge>
            )}
          </div>
          <p className="text-sm text-[var(--color-ink-muted)] flex items-center gap-1.5 mt-1">
            <Icon name="pin" size={13} /> {shop.city} · partenaire depuis {dateFR(shop.createdAt)}
          </p>
          {shop.description && <p className="text-[15px] text-[var(--color-ink-soft)] mt-3 max-w-3xl leading-relaxed">{shop.description}</p>}
        </div>
        <dl className="grid grid-cols-3 sm:grid-cols-1 gap-3 sm:gap-2 sm:min-w-[190px] text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)]">Note</dt>
            <dd>{shop.ratingCount > 0 ? <Rating value={shop.rating} count={shop.ratingCount} /> : "Nouveau"}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)]">Articles vendus</dt>
            <dd className="font-semibold">{sold._sum.quantity ?? 0}</dd>
          </div>
          {conform !== null && (
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-[var(--color-ink-muted)]">Défaut conforme</dt>
              <dd className="font-semibold">{conform} % des avis</dd>
            </div>
          )}
        </dl>
      </header>

      <h2 className="font-display text-2xl font-bold mb-4">
        {products.length} article{products.length > 1 ? "s" : ""} en vente
      </h2>
      {products.length === 0 ? (
        <EmptyState icon="tag" title="Aucun article en ligne pour le moment" />
      ) : (
        <ProductGrid>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} isFavorite={favs.has(p.id)} revalidate={`/boutique/${slug}`} />
          ))}
        </ProductGrid>
      )}
    </div>
  );
}
