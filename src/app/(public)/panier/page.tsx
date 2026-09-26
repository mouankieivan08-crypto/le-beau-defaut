import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { updateCartQuantityAction, removeFromCartAction } from "@/lib/actions/shop";
import Icon from "@/components/Icon";
import { EmptyState, GradeBadge, Breadcrumb, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Mon panier" };

export default async function CartPage() {
  const user = await requireUser("/panier");

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          images: { where: { isCover: true }, take: 1 },
          seller: { select: { seller: { select: { shopName: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const available = items.filter((i) => i.product.status === "PUBLIE" && i.product.quantity > 0);
  const unavailable = items.filter((i) => !available.includes(i));
  const subtotal = available.reduce((s, i) => s + i.product.price * Math.min(i.quantity, i.product.quantity), 0);
  const savings = available.reduce(
    (s, i) => s + (i.product.priceOriginal - i.product.price) * Math.min(i.quantity, i.product.quantity),
    0
  );

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Panier" }]} />
      <h1 className="font-display text-[32px] font-bold mb-6">Mon panier</h1>

      {items.length === 0 ? (
        <EmptyState
          icon="cart"
          title="Votre panier est vide"
          message="Les meilleures pièces partent vite : un canapé à −40 % ne reste jamais longtemps."
          action={
            <Link href="/catalogue" className="btn btn-primary">
              Parcourir le catalogue
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-7 items-start">
          <div className="flex flex-col gap-3">
            {unavailable.length > 0 && (
              <Alert tone="warning" title="Certains articles ne sont plus disponibles">
                Ils ont été vendus ou retirés entre-temps et ne seront pas commandés.
              </Alert>
            )}

            {items.map((item) => {
              const p = item.product;
              const out = !available.includes(item);
              return (
                <article key={item.id} className={`surface p-4 flex gap-4 ${out ? "opacity-55" : ""}`}>
                  <Link href={`/produit/${p.slug}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]?.url}
                      alt={p.title}
                      className="h-24 w-24 sm:h-28 sm:w-28 rounded-xl object-cover bg-[var(--color-cream-deep)]"
                    />
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/produit/${p.slug}`}
                          className="font-display font-semibold leading-snug hover:text-[var(--color-gold-dark)] line-clamp-2"
                        >
                          {p.title}
                        </Link>
                        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                          {p.seller.seller?.shopName} · {p.city}
                        </p>
                      </div>
                      <GradeBadge grade={p.defectGrade} size="sm" />
                    </div>

                    <p className="text-xs text-[var(--color-ink-muted)] mt-2 line-clamp-1 flex gap-1.5">
                      <Icon name="info" size={12} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
                      {p.defectSummary}
                    </p>

                    <div className="flex items-end justify-between gap-3 mt-auto pt-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        {out ? (
                          <span className="chip bg-[var(--color-grade-c-bg)] text-[var(--color-danger)]">
                            Indisponible
                          </span>
                        ) : p.quantity > 1 ? (
                          <form action={updateCartQuantityAction} className="flex items-center gap-1.5">
                            <input type="hidden" name="itemId" value={item.id} />
                            <select
                              name="quantity"
                              defaultValue={Math.min(item.quantity, p.quantity)}
                              className="field !py-1.5 !w-[70px]"
                              aria-label="Quantité"
                            >
                              {Array.from({ length: Math.min(p.quantity, 10) }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                            <button className="btn btn-ghost btn-sm">OK</button>
                          </form>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-muted)]">Pièce unique</span>
                        )}

                        <form action={removeFromCartAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button
                            className="btn btn-ghost btn-sm text-[var(--color-danger)]"
                            aria-label="Retirer du panier"
                          >
                            <Icon name="trash" size={14} /> Retirer
                          </button>
                        </form>
                      </div>

                      <div className="text-right">
                        <p className="font-display font-bold">
                          {money(p.price * Math.min(item.quantity, Math.max(1, p.quantity)))}
                        </p>
                        <p className="text-[11px] text-[var(--color-ink-muted)] line-through">
                          {money(p.priceOriginal * item.quantity, false)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Récapitulatif */}
          <aside className="surface p-5 lg:sticky lg:top-[136px]">
            <h2 className="font-display text-lg font-bold mb-4">Récapitulatif</h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">
                  Articles ({available.reduce((s, i) => s + i.quantity, 0)})
                </dt>
                <dd className="font-medium">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Livraison</dt>
                <dd className="text-[var(--color-ink-muted)]">Calculée à l&apos;étape suivante</dd>
              </div>
              <div className="flex justify-between text-[var(--color-success)]">
                <dt>Économie grâce aux défauts</dt>
                <dd className="font-semibold">−{money(savings)}</dd>
              </div>
            </dl>
            <div className="rule-gold my-4" />
            <div className="flex justify-between items-baseline mb-5">
              <span className="font-semibold">Sous-total</span>
              <span className="font-display text-2xl font-bold">{money(subtotal)}</span>
            </div>

            {available.length > 0 ? (
              <Link href="/commande" className="btn btn-primary btn-lg w-full">
                Passer la commande <Icon name="arrow-right" size={16} />
              </Link>
            ) : (
              <button className="btn btn-primary btn-lg w-full" disabled>
                Aucun article disponible
              </button>
            )}

            <Link href="/catalogue" className="btn btn-ghost w-full mt-2">
              Continuer mes achats
            </Link>

            <ul className="flex flex-col gap-2 mt-5 pt-4 border-t border-[var(--color-sand)] text-xs text-[var(--color-ink-muted)]">
              <li className="flex gap-2">
                <Icon name="shield" size={14} className="text-[var(--color-gold)] shrink-0" />
                Défaut non annoncé = article repris
              </li>
              <li className="flex gap-2">
                <Icon name="wallet" size={14} className="text-[var(--color-gold)] shrink-0" />
                Dépôt Mobile Money, espèces à la livraison ou sur place
              </li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
