import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth";
import { money, moneyCompact, relativeFR } from "@/lib/format";
import { weeklySeries, daysAgo, deltaPct, LIVE_ORDER } from "@/lib/stats";
import { ORDER_STATUS } from "@/lib/constants";
import { ColumnChart, BarList } from "@/components/Charts";
import Icon from "@/components/Icon";
import { Stat, Card, Badge, Alert, PageHeader, GradeBadge, Rating, EmptyState } from "@/components/ui";

export default async function SellerDashboard() {
  const user = await requireSeller("/vendeur");
  const shop = user.seller;

  const d30 = daysAgo(30);
  const d60 = daysAgo(60);

  const [items30, items60, itemsChart, payoutsDue, productStats, views, topViewed, toPrepare, rejected] = await Promise.all([
    prisma.orderItem.findMany({
      where: { sellerId: user.id, order: { ...LIVE_ORDER, createdAt: { gte: d30 } } },
      select: { sellerAmount: true, quantity: true, orderId: true },
    }),
    prisma.orderItem.findMany({
      where: { sellerId: user.id, order: { ...LIVE_ORDER, createdAt: { gte: d60, lt: d30 } } },
      select: { sellerAmount: true, quantity: true, orderId: true },
    }),
    prisma.orderItem.findMany({
      where: { sellerId: user.id, order: { ...LIVE_ORDER, createdAt: { gte: daysAgo(84) } } },
      select: { sellerAmount: true, order: { select: { createdAt: true } } },
    }),
    shop
      ? prisma.payout.aggregate({ where: { sellerId: shop.id, status: { in: ["EN_ATTENTE", "SEQUESTRE"] } }, _sum: { amount: true }, _count: true })
      : null,
    prisma.product.groupBy({ by: ["status"], where: { sellerId: user.id }, _count: true }),
    prisma.product.aggregate({ where: { sellerId: user.id }, _sum: { views: true } }),
    prisma.product.findMany({
      where: { sellerId: user.id, status: "PUBLIE" },
      select: { id: true, title: true, views: true, defectGrade: true, _count: { select: { favorites: true } } },
      orderBy: { views: "desc" },
      take: 5,
    }),
    prisma.order.findMany({
      where: { items: { some: { sellerId: user.id } }, status: { in: ["PAYEE", "CONFIRMEE", "EN_PREPARATION"] } },
      include: { items: { where: { sellerId: user.id } }, delivery: { select: { status: true } } },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.product.findMany({
      where: { sellerId: user.id, status: "REJETE" },
      select: { id: true, title: true, rejectionReason: true },
      take: 3,
    }),
  ]);

  const net30 = items30.reduce((s, i) => s + i.sellerAmount, 0);
  const net60 = items60.reduce((s, i) => s + i.sellerAmount, 0);
  const units30 = items30.reduce((s, i) => s + i.quantity, 0);
  const units60 = items60.reduce((s, i) => s + i.quantity, 0);
  const countBy = Object.fromEntries(productStats.map((p) => [p.status, p._count])) as Record<string, number>;
  const weekly = weeklySeries(itemsChart.map((i) => ({ date: i.order.createdAt, amount: i.sellerAmount })), 12);

  return (
    <>
      <PageHeader
        title={shop?.shopName ?? `Bonjour ${user.firstName}`}
        subtitle="Vos ventes, vos annonces et vos versements en un coup d'œil."
        action={
          <Link href="/vendeur/annonces/nouvelle" className="btn btn-gold">
            <Icon name="plus" size={15} /> Nouvelle annonce
          </Link>
        }
      />

      {shop?.status === "EN_ATTENTE" && (
        <div className="mb-5">
          <Alert tone="warning" title="Boutique en cours de validation">
            Notre équipe vérifie vos informations (RCCM, NIU, téléphone). Complétez votre fiche boutique pour
            accélérer l&apos;activation — vous pourrez publier ensuite.{" "}
            <Link href="/vendeur/boutique" className="underline font-medium">
              Compléter ma boutique
            </Link>
          </Alert>
        </div>
      )}
      {shop?.status === "SUSPENDU" && (
        <div className="mb-5">
          <Alert tone="danger" title="Boutique suspendue">
            Vos annonces ne sont plus visibles. Contactez l&apos;équipe Le Beau Défaut.
          </Alert>
        </div>
      )}
      {rejected.length > 0 && (
        <div className="mb-5">
          <Alert tone="danger" title={`${rejected.length} annonce(s) à corriger`}>
            <ul className="mt-1 flex flex-col gap-1">
              {rejected.map((r) => (
                <li key={r.id}>
                  <Link href={`/vendeur/annonces/${r.id}`} className="underline font-medium">
                    {r.title}
                  </Link>{" "}
                  — {r.rejectionReason}
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Ventes nettes · 30 j"
          value={`${moneyCompact(net30)} F`}
          icon="wallet"
          tone="gold"
          delta={{ pct: deltaPct(net30, net60), vs: "vs 30 j précédents" }}
        />
        <Stat
          label="Articles vendus · 30 j"
          value={units30}
          icon="package"
          delta={{ pct: deltaPct(units30, units60), vs: "vs 30 j précédents" }}
        />
        <Stat
          label="À percevoir"
          value={money(payoutsDue?._sum.amount ?? 0)}
          hint={shop?.isHouse ? "Boutique maison : pas de versement" : `${payoutsDue?._count ?? 0} vente(s) livrée(s), séquestre compris`}
          icon="wallet"
          href="/vendeur/paiements"
        />
        <Stat
          label="Articles en ligne"
          value={countBy.PUBLIE ?? 0}
          hint={`${countBy.EN_ATTENTE ?? 0} en validation · ${views._sum.views ?? 0} vues`}
          icon="tag"
          href="/vendeur/annonces"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 mb-6">
        <Card>
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="font-display text-lg font-bold">Ventes nettes par semaine</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">Montant qui vous revient, commission déduite · 12 semaines</p>
            </div>
            {shop && (
              <p className="text-xs text-[var(--color-ink-muted)]">
                Commission actuelle <strong className="text-[var(--color-ink)]">{shop.commissionPct} %</strong>
              </p>
            )}
          </div>
          <ColumnChart data={weekly} caption="Ventes nettes hebdomadaires sur 12 semaines" />
        </Card>

        <Card>
          <h2 className="font-display text-lg font-bold">Vos articles les plus vus</h2>
          <p className="text-xs text-[var(--color-ink-muted)] mb-4">Pensez à baisser le prix d&apos;un article très vu mais pas vendu.</p>
          {topViewed.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)]">Aucune annonce en ligne.</p>
          ) : (
            <BarList
              caption="Vues par annonce"
              rows={topViewed.map((p) => ({
                key: p.id,
                label: p.title,
                value: p.views,
                detail: `${p._count.favorites} mise(s) en favori`,
              }))}
              prefix={Object.fromEntries(topViewed.map((p) => [p.id, <GradeBadge key={p.id} grade={p.defectGrade} size="sm" />]))}
            />
          )}
          {shop && shop.ratingCount > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--color-sand)] flex items-center justify-between">
              <span className="text-sm text-[var(--color-ink-muted)]">Note de la boutique</span>
              <Rating value={shop.rating} count={shop.ratingCount} />
            </div>
          )}
        </Card>
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold">Commandes à préparer</h2>
            <p className="text-xs text-[var(--color-ink-muted)]">Confirmez la disponibilité puis préparez l&apos;article pour le livreur.</p>
          </div>
          <Link href="/vendeur/ventes" className="btn btn-ghost btn-sm">
            Toutes les ventes <Icon name="arrow-right" size={13} />
          </Link>
        </div>
        {toPrepare.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState icon="check-circle" title="Rien à préparer" message="Les nouvelles commandes apparaîtront ici." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-lbd">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Articles</th>
                  <th>Statut</th>
                  <th className="!text-right">Pour vous</th>
                </tr>
              </thead>
              <tbody>
                {toPrepare.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href="/vendeur/ventes" className="font-mono text-xs font-medium">
                        {o.reference}
                      </Link>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">
                        {relativeFR(o.createdAt)} · {o.quartier}, {o.city}
                      </p>
                    </td>
                    <td className="text-xs">{o.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(" · ")}</td>
                    <td>
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    </td>
                    <td className="text-right font-semibold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(o.items.reduce((s, i) => s + i.sellerAmount, 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
