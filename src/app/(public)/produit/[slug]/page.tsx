import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cardSelect, PUBLISHED, favoriteIds } from "@/lib/queries";
import { money, waLink } from "@/lib/format";
import { AUTHENTICITY, VERTICAL_LIST, gradeOf } from "@/lib/constants";
import { addToCartAction, toggleFavoriteAction } from "@/lib/actions/shop";
import Gallery from "@/components/Gallery";
import DefectReport from "@/components/DefectReport";
import ProductCard, { ProductGrid } from "@/components/ProductCard";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, Price, Rating, Breadcrumb, SectionTitle, Avatar, Alert } from "@/components/ui";
import ReviewForm from "@/components/ReviewForm";
import ShareButtons from "@/components/ShareButtons";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      defects: { orderBy: { severity: "desc" } },
      category: true,
      seller: { include: { seller: true } },
      reviews: {
        where: { isPublished: true },
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, defectSummary: true, price: true, images: { where: { isCover: true }, take: 1 } },
  });
  if (!p) return { title: "Article introuvable" };
  return {
    title: p.title,
    description: `${p.defectSummary} — ${money(p.price)}`,
    openGraph: { images: p.images[0]?.url ? [p.images[0].url] : [] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await load(slug);
  if (!product) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === product.sellerId;
  const visible = product.status === "PUBLIE" || isOwner || user?.role === "ADMIN";
  if (!visible) notFound();

  // Compteur de vues (pas pour le vendeur lui-même)
  if (!isOwner) {
    await prisma.product.update({ where: { id: product.id }, data: { views: { increment: 1 } } }).catch(() => {});
  }

  const [favs, similar, canReview] = await Promise.all([
    favoriteIds(user?.id),
    prisma.product.findMany({
      where: {
        ...PUBLISHED,
        vertical: product.vertical,
        NOT: { id: product.id },
        OR: [{ categoryId: product.categoryId }, { defectGrade: product.defectGrade }],
      },
      select: cardSelect,
      take: 4,
      orderBy: { publishedAt: "desc" },
    }),
    user
      ? prisma.orderItem.findFirst({
          where: { productId: product.id, order: { buyerId: user.id, status: "LIVREE" } },
        })
      : null,
  ]);

  const isFavorite = favs.has(product.id);
  const g = gradeOf(product.defectGrade);
  const vertical = VERTICAL_LIST.find((v) => v.key === product.vertical);
  const soldOut = product.quantity <= 0 || product.status === "VENDU";
  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : 0;
  const conformCount = product.reviews.filter((r) => r.defectAsDescribed).length;
  const myReview = user ? product.reviews.find((r) => r.userId === user.id) : null;
  const sellerWhatsApp = waLink(
    product.seller.seller?.contactPhone,
    `Bonjour, je vous contacte depuis Le Beau Défaut au sujet de « ${product.title} » (${product.reference}).`
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: vertical?.label ?? "Catalogue", href: `/${vertical?.slug ?? "catalogue"}` },
          { label: product.category.name, href: `/catalogue?categorie=${product.category.slug}` },
          { label: product.title },
        ]}
      />

      {product.status !== "PUBLIE" && (
        <div className="mb-5">
          <Alert tone="warning" title="Cette annonce n'est pas publique">
            Statut actuel : <strong>{product.status.replace(/_/g, " ").toLowerCase()}</strong>.
            {product.rejectionReason && <> Motif : {product.rejectionReason}</>}
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
        {/* ------------- Colonne images ------------- */}
        <div className="lg:sticky lg:top-[136px]">
          <Gallery images={product.images} title={product.title} />
        </div>

        {/* ------------- Colonne achat ------------- */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <Badge tone="neutral">{product.category.name}</Badge>
              {product.brand && <Badge tone="neutral">{product.brand}</Badge>}
              {product.vertical === "SACS" && product.authenticity !== "NON_APPLICABLE" && (
                <Badge tone={AUTHENTICITY[product.authenticity].tone}>
                  <Icon name="shield" size={10} /> {AUTHENTICITY[product.authenticity].label}
                </Badge>
              )}
              {product.negotiable && <Badge tone="info">Prix négociable</Badge>}
            </div>

            <h1 className="font-display text-[28px] lg:text-[32px] font-bold leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-[var(--color-ink-muted)]">
              <span className="font-mono">{product.reference}</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="eye" size={12} /> {product.views} vue{product.views > 1 ? "s" : ""}
              </span>
              {product.reviews.length > 0 && <Rating value={avgRating} count={product.reviews.length} />}
            </div>
          </div>

          {/* Prix */}
          <div className="surface p-5">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <Price price={product.price} original={product.priceOriginal} size="lg" />
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  Vous économisez{" "}
                  <strong className="text-[var(--color-success)]">
                    {money(product.priceOriginal - product.price)}
                  </strong>{" "}
                  grâce au défaut.
                </p>
              </div>
              <span className="chip text-base font-bold px-3 py-1.5" style={{ background: g.color, color: "#fff" }}>
                −{product.discountPct} %
              </span>
            </div>

            <div className="rule-gold my-4" />

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <GradeBadge grade={product.defectGrade} withName />
              </span>
              <Link href="/le-defaut" className="text-xs text-[var(--color-gold-dark)] underline underline-offset-2">
                Que veut dire ce grade ?
              </Link>
            </div>
          </div>

          {/* Disponibilité & actions */}
          {soldOut ? (
            <Alert tone="danger" title="Article vendu">
              Cette pièce est partie. Les articles à petit défaut sont souvent uniques — activez les favoris
              pour être prévenu des arrivages similaires.
            </Alert>
          ) : isOwner ? (
            <Alert tone="info" title="C'est votre annonce">
              <Link href={`/vendeur/annonces/${product.id}`} className="underline font-medium">
                Modifier l&apos;annonce
              </Link>
            </Alert>
          ) : (
            <div className="flex flex-col gap-3">
              <form action={addToCartAction} className="flex gap-2.5">
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="back" value={`/produit/${product.slug}`} />
                {product.quantity > 1 && (
                  <select
                    name="quantity"
                    defaultValue={1}
                    className="field !w-20"
                    aria-label="Quantité"
                  >
                    {Array.from({ length: Math.min(product.quantity, 10) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                )}
                <button className="btn btn-primary btn-lg flex-1">
                  <Icon name="cart" size={17} /> Ajouter au panier
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <form
                  action={async () => {
                    "use server";
                    await toggleFavoriteAction(product.id, `/produit/${product.slug}`);
                  }}
                  className="flex-1"
                >
                  <button className="btn btn-outline w-full">
                    <Icon
                      name={isFavorite ? "heart-filled" : "heart"}
                      size={16}
                      className={isFavorite ? "text-[var(--color-danger)]" : ""}
                    />
                    {isFavorite ? "Dans vos favoris" : "Ajouter aux favoris"}
                  </button>
                </form>
                <Link
                  href={user ? `/messages/nouveau?produit=${product.id}` : "/connexion"}
                  className="btn btn-outline flex-1"
                >
                  <Icon name="message" size={16} /> Poser une question
                </Link>
              </div>

              {sellerWhatsApp && (
                <a href={sellerWhatsApp} target="_blank" rel="noreferrer" className="btn btn-outline w-full">
                  <Icon name="phone" size={16} /> Écrire au vendeur sur WhatsApp
                </a>
              )}

              {product.quantity === 1 ? (
                <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5">
                  <Icon name="sparkle" size={13} className="text-[var(--color-gold)]" /> Pièce unique : elle ne sera pas réassortie
                </p>
              ) : (
                product.quantity <= 3 && (
                  <p className="text-xs text-[var(--color-gold-deep)] flex items-center gap-1.5">
                    <Icon name="alert" size={13} /> Plus que {product.quantity} en stock
                  </p>
                )
              )}
            </div>
          )}

          {/* Livraison */}
          <div className="surface p-4 flex flex-col gap-2.5 text-sm">
            <p className="flex items-start gap-2.5">
              <Icon name="pin" size={15} className="mt-0.5 text-[var(--color-gold)] shrink-0" />
              <span>
                Disponible à <strong>{product.quartier ? `${product.quartier}, ` : ""}{product.city}</strong>
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <Icon name="truck" size={15} className="mt-0.5 text-[var(--color-gold)] shrink-0" />
              <span>
                {product.pickupOnly
                  ? "Retrait sur place uniquement (article volumineux)."
                  : "Livraison possible — frais calculés selon le quartier au moment de la commande."}
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <Icon name="wallet" size={15} className="mt-0.5 text-[var(--color-gold)] shrink-0" />
              <span>Mobile Money (MTN, Airtel) ou espèces à la livraison.</span>
            </p>
          </div>

          <ShareButtons
            title={product.title}
            text={`${product.title} — ${money(product.price)} sur Le Beau Défaut`}
          />

          {/* Vendeur */}
          {product.seller.seller && (
            <div className="surface p-4">
              <p className="label mb-2.5">Vendu par</p>
              <div className="flex items-center gap-3">
                <Avatar
                  first={product.seller.seller.shopName}
                  last=""
                  url={product.seller.seller.logoUrl}
                  size={42}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{product.seller.seller.shopName}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
                    {product.seller.seller.ratingCount > 0 ? (
                      <Rating value={product.seller.seller.rating} count={product.seller.seller.ratingCount} size={11} />
                    ) : (
                      <span>Nouveau vendeur</span>
                    )}
                  </div>
                </div>
                <Link href={`/boutique/${product.seller.seller.shopSlug}`} className="btn btn-ghost btn-sm">
                  Voir <Icon name="chevron-right" size={13} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------- Rapport du défaut ------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 items-start mt-10">
        <div className="flex flex-col gap-8">
          <DefectReport
            grade={product.defectGrade}
            summary={product.defectSummary}
            defects={product.defects}
            discountPct={product.discountPct}
          />

          <section className="surface p-6">
            <h2 className="font-display text-lg font-bold mb-3">Description</h2>
            <div className="text-[15px] text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </section>
        </div>

        {/* Caractéristiques */}
        <section className="surface p-6">
          <h2 className="font-display text-lg font-bold mb-4">Caractéristiques</h2>
          <dl className="grid grid-cols-1 gap-0">
            <Spec label="Référence" value={product.reference} />
            <Spec label="Catégorie" value={product.category.name} />
            {product.brand && <Spec label="Marque" value={product.brand} />}
            {product.material && <Spec label="Matière" value={product.material} />}
            {product.color && <Spec label="Couleur" value={product.color} />}
            {product.dimensions && <Spec label="Dimensions" value={product.dimensions} />}
            {product.weightKg && <Spec label="Poids" value={`${product.weightKg} kg`} />}
            <Spec label="Quantité disponible" value={String(Math.max(0, product.quantity))} />
            {product.vertical === "SACS" && (
              <>
                {product.serialNumber && <Spec label="Numéro de série" value={product.serialNumber} />}
                <Spec label="Dust bag fourni" value={product.hasDustBag ? "Oui" : "Non"} />
                <Spec label="Certificat / facture" value={product.hasCertif ? "Oui" : "Non"} />
                <Spec label="Authenticité" value={AUTHENTICITY[product.authenticity].label} />
              </>
            )}
            <Spec label="Prix neuf constaté" value={money(product.priceOriginal)} />
            <Spec label="Prix Le Beau Défaut" value={money(product.price)} />
          </dl>
        </section>
      </div>

      {/* ------------- Avis ------------- */}
      <section id="avis" className="mt-12 scroll-mt-40">
        <SectionTitle
          eyebrow={
            product.reviews.length > 0
              ? `${conformCount}/${product.reviews.length} acheteurs confirment que le défaut était conforme`
              : undefined
          }
          title="Avis des acheteurs"
        />

        {product.reviews.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--color-ink-muted)]">
            Aucun avis pour le moment sur cet article.
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.reviews.map((r) => (
              <li key={r.id} className="surface p-5">
                <div className="flex items-start gap-3">
                  <Avatar first={r.user.firstName} last={r.user.lastName} url={r.user.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-sm">
                        {r.user.firstName} {r.user.lastName[0]}.
                      </p>
                      <Rating value={r.rating} size={12} />
                    </div>
                    <Badge tone={r.defectAsDescribed ? "success" : "danger"} className="mt-1.5">
                      <Icon name={r.defectAsDescribed ? "check" : "alert"} size={10} />
                      {r.defectAsDescribed ? "Défaut conforme à l'annonce" : "Défaut différent de l'annonce"}
                    </Badge>
                    {r.comment && (
                      <p className="text-sm text-[var(--color-ink-soft)] mt-2 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {canReview && (
          <div className="mt-5">
            <ReviewForm productId={product.id} existing={myReview ?? null} />
          </div>
        )}
      </section>

      {/* ------------- Similaires ------------- */}
      {similar.length > 0 && (
        <section className="mt-14">
          <SectionTitle eyebrow="Dans le même esprit" title="Ces articles pourraient vous plaire" />
          <ProductGrid>
            {similar.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isFavorite={favs.has(p.id)}
                revalidate={`/produit/${product.slug}`}
              />
            ))}
          </ProductGrid>
        </section>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-[var(--color-sand)]/60 last:border-0">
      <dt className="text-xs text-[var(--color-ink-muted)] shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-right">{value}</dd>
    </div>
  );
}
