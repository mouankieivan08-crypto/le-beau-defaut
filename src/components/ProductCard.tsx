import Link from "next/link";
import Icon from "./Icon";
import { GradeBadge, Price, DiscountTag, Badge } from "./ui";
import { toggleFavoriteAction } from "@/lib/actions/shop";
import { sized, srcSet } from "@/lib/images";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  priceOriginal: number;
  discountPct: number;
  defectGrade: string;
  defectSummary: string;
  city: string;
  quartier: string | null;
  vertical: string;
  saleMode?: string;
  authenticity: string;
  quantity: number;
  isFlashDeal: boolean;
  images: { url: string; alt: string | null }[];
  category?: { name: string } | null;
  seller?: { seller: { shopName: string } | null } | null;
};

export default function ProductCard({
  product,
  isFavorite = false,
  revalidate = "/",
  compact = false,
}: {
  product: ProductCardData;
  isFavorite?: boolean;
  revalidate?: string;
  compact?: boolean;
}) {
  const cover = product.images[0]?.url;
  const soldOut = product.quantity <= 0;

  return (
    <article className="surface surface-hover overflow-hidden flex flex-col h-full group">
      <div className="relative">
        <Link href={`/produit/${product.slug}`} className="block aspect-[4/3] bg-[var(--color-cream-deep)] overflow-hidden">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sized(cover, 520)}
              srcSet={srcSet(cover, 520)}
              sizes="(max-width: 640px) 50vw, 320px"
              alt={product.images[0]?.alt ?? product.title}
              width={520}
              height={390}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="h-full w-full grid place-items-center text-[var(--color-ink-muted)]">
              <Icon name="camera" size={28} />
            </span>
          )}
        </Link>

        {/* Pastilles */}
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          <DiscountTag pct={product.discountPct} />
          {product.isFlashDeal && (
            <Badge tone="danger" className="!bg-[var(--color-danger)] !text-white">
              <Icon name="sparkle" size={10} /> Bonne affaire
            </Badge>
          )}
          {product.authenticity === "AUTHENTIFIE_LBD" && (
            <Badge tone="success">
              <Icon name="shield" size={10} /> Authentifié
            </Badge>
          )}
        </div>

        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
          <form
            action={async () => {
              "use server";
              await toggleFavoriteAction(product.id, revalidate);
            }}
          >
            <button
              className="h-8 w-8 grid place-items-center rounded-full bg-[var(--color-linen)]/92 backdrop-blur text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] transition-colors shadow-sm"
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Icon
                name={isFavorite ? "heart-filled" : "heart"}
                size={15}
                className={isFavorite ? "text-[var(--color-danger)]" : ""}
              />
            </button>
          </form>
          <span className="rounded-full bg-[var(--color-linen)]/92 backdrop-blur p-0.5 shadow-sm">
            <GradeBadge grade={product.defectGrade} size="sm" />
          </span>
        </div>

        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-[var(--color-ink)]/55">
            <span className="chip bg-[var(--color-linen)] text-[var(--color-ink)] !text-xs">Vendu</span>
          </div>
        )}
      </div>

      <div className="p-3.5 flex flex-col flex-1">
        {product.category && !compact && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-muted)] mb-1">
            {product.category.name}
          </p>
        )}

        <h3 className="font-display font-semibold leading-snug line-clamp-2 mb-1.5">
          <Link href={`/produit/${product.slug}`} className="hover:text-[var(--color-gold-dark)] transition-colors">
            {product.title}
          </Link>
        </h3>

        {/* Le défaut, toujours visible — c'est la promesse */}
        <p className="text-[11.5px] text-[var(--color-ink-muted)] leading-snug line-clamp-2 mb-3 flex gap-1.5">
          <Icon name="info" size={12} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
          <span>{product.defectSummary}</span>
        </p>

        <div className="mt-auto">
          <Price price={product.price} original={product.priceOriginal} />
          <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-[var(--color-ink-muted)]">
            <span className="inline-flex items-center gap-1 truncate">
              <Icon name="pin" size={11} />
              {product.quartier ? `${product.quartier}, ` : ""}
              {product.city}
            </span>
            <span className="inline-flex items-center gap-1 text-[var(--color-gold-dark)] font-medium shrink-0">
              <Icon name="sparkle" size={11} /> Notre stock
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 3 | 4 }) {
  return (
    <div
      className={`grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-3 ${cols === 4 ? "xl:grid-cols-4" : ""}`}
    >
      {children}
    </div>
  );
}
