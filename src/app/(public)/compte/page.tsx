import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireClientSpace } from "@/lib/auth";
import { cardSelect, PUBLISHED } from "@/lib/queries";
import { money, dateFR } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";
import { AccountLayout } from "@/components/AccountNav";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/Icon";
import { Stat, Badge, EmptyState, Steps } from "@/components/ui";

export const metadata: Metadata = { title: "Mon compte" };

const STEP_LABELS = ["Commandée", "Payée", "Confirmée", "Préparée", "En route", "Livrée"];

export default async function AccountPage() {
  const user = await requireClientSpace("/compte", "/admin");

  const [orders, favCount, stats, unread, favs] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: user.id },
      include: { items: { take: 3 } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { buyerId: user.id, status: { notIn: ["ANNULEE", "REMBOURSEE"] } },
      select: { total: true, items: { select: { lineTotal: true, product: { select: { priceOriginal: true } }, quantity: true } } },
    }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.favorite.findMany({
      where: { userId: user.id, product: PUBLISHED },
      include: { product: { select: cardSelect } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const totalSpent = stats.reduce((s, o) => s + o.total, 0);
  const totalSaved = stats.reduce(
    (s, o) => s + o.items.reduce((a, i) => a + (i.product.priceOriginal * i.quantity - i.lineTotal), 0),
    0
  );
  const inProgress = orders.filter((o) => !["LIVREE", "ANNULEE", "REMBOURSEE"].includes(o.status));

  return (
    <AccountLayout active="/compte" user={user}>
      <div className="mb-6">
        <p className="font-script text-gilded text-2xl leading-none">Bonjour {user.firstName},</p>
        <h1 className="font-display text-[28px] font-bold mt-1">Votre espace</h1>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-7">
        <Stat label="Commandes" value={stats.length} icon="package" href="/compte/commandes" />
        <Stat label="En cours" value={inProgress.length} icon="truck" tone="info" href="/compte/commandes" />
        <Stat label="Favoris" value={favCount} icon="heart" tone="gold" href="/compte/favoris" />
        <Stat
          label="Économisé"
          value={money(totalSaved, false)}
          hint={`FCFA sur ${money(totalSpent)} d'achats`}
          icon="tag"
          tone="success"
        />
      </div>

      {unread > 0 && (
        <Link
          href="/notifications"
          className="surface surface-hover flex items-center gap-3 p-4 mb-7 border-l-4 !border-l-[var(--color-gold)]"
        >
          <Icon name="bell" size={18} className="text-[var(--color-gold)]" />
          <span className="text-sm flex-1">
            Vous avez <strong>{unread}</strong> notification{unread > 1 ? "s" : ""} non lue{unread > 1 ? "s" : ""}.
          </span>
          <Icon name="chevron-right" size={16} className="opacity-40" />
        </Link>
      )}

      <section className="mb-9">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Dernières commandes</h2>
          <Link href="/compte/commandes" className="btn btn-ghost btn-sm">
            Tout voir <Icon name="arrow-right" size={13} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon="package"
            title="Aucune commande pour l'instant"
            message="Votre première bonne affaire vous attend dans le catalogue."
            action={
              <Link href="/catalogue" className="btn btn-primary">
                Découvrir les articles
              </Link>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((o) => {
              const st = ORDER_STATUS[o.status];
              return (
                <li key={o.id}>
                  <Link href={`/compte/commandes/${o.id}`} className="surface surface-hover p-4 block">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex -space-x-3">
                        {o.items.map((it) =>
                          it.imageSnapshot ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={it.id}
                              src={it.imageSnapshot}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover border-2 border-[var(--color-linen)]"
                            />
                          ) : null
                        )}
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <p className="font-mono text-xs text-[var(--color-ink-muted)]">{o.reference}</p>
                        <p className="text-sm font-medium line-clamp-1">
                          {o.items.map((i) => i.titleSnapshot).join(", ")}
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)]">{dateFR(o.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold">{money(o.total)}</p>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                    </div>
                    {st.step >= 0 && st.step < 5 && (
                      <div className="mt-4">
                        <Steps current={st.step} labels={STEP_LABELS} />
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {favs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Vos coups de cœur</h2>
            <Link href="/compte/favoris" className="btn btn-ghost btn-sm">
              Tous les favoris <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {favs.map((f) => (
              <ProductCard key={f.id} product={f.product} isFavorite revalidate="/compte" compact />
            ))}
          </div>
        </section>
      )}
    </AccountLayout>
  );
}
