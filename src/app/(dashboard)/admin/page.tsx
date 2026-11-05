import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, moneyCompact, relativeFR } from "@/lib/format";
import { weeklySeries, daysAgo, deltaPct, LIVE_ORDER } from "@/lib/stats";
import { GRADE_LIST, ORDER_STATUS, VERTICALS } from "@/lib/constants";
import { ColumnChart, ShareBar, BarList } from "@/components/Charts";
import Icon from "@/components/Icon";
import { Stat, Badge, GradeBadge, Card, PageHeader } from "@/components/ui";

export default async function AdminDashboard() {
  const admin = await requireAdmin("/admin");

  const d30 = daysAgo(30);
  const d60 = daysAgo(60);
  const d84 = daysAgo(84);

  const [
    ordersRecent,
    ordersPrev,
    itemsRecent,
    itemsPrev,
    ordersForChart,
    itemsByVertical,
    gradeCounts,
    published,
    pendingProducts,
    pendingSellers,
    latestOrders,
    reviewAgg,
    reviewConform,
    newUsers,
    newUsersPrev,
    toAssign,
    pendingPayouts,
    openClaims,
  ] = await Promise.all([
    prisma.order.findMany({ where: { ...LIVE_ORDER, createdAt: { gte: d30 } }, select: { total: true } }),
    prisma.order.findMany({ where: { ...LIVE_ORDER, createdAt: { gte: d60, lt: d30 } }, select: { total: true } }),
    prisma.orderItem.findMany({
      where: { order: { ...LIVE_ORDER, createdAt: { gte: d30 } } },
      select: { lineTotal: true, sellerAmount: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { ...LIVE_ORDER, createdAt: { gte: d60, lt: d30 } } },
      select: { lineTotal: true, sellerAmount: true },
    }),
    prisma.order.findMany({ where: { ...LIVE_ORDER, createdAt: { gte: d84 } }, select: { total: true, createdAt: true } }),
    prisma.orderItem.findMany({
      where: { order: LIVE_ORDER },
      select: { lineTotal: true, quantity: true, product: { select: { vertical: true } } },
    }),
    prisma.product.groupBy({ by: ["defectGrade"], where: { status: "PUBLIE" }, _count: true }),
    prisma.product.count({ where: { status: "PUBLIE" } }),
    prisma.product.findMany({
      where: { status: "EN_ATTENTE" },
      include: {
        images: { where: { isCover: true }, take: 1 },
        seller: { select: { seller: { select: { shopName: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.sellerProfile.findMany({ where: { status: "EN_ATTENTE" }, include: { user: true }, take: 3 }),
    prisma.order.findMany({
      include: { buyer: { select: { firstName: true, lastName: true } }, items: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: true }),
    prisma.review.count({ where: { defectAsDescribed: true } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.user.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.delivery.count({
      where: { status: "A_ASSIGNER", order: { status: { notIn: ["ANNULEE", "EN_ATTENTE_PAIEMENT"] } } },
    }),
    prisma.payout.aggregate({ where: { status: "EN_ATTENTE" }, _sum: { amount: true }, _count: true }),
    prisma.claim.count({ where: { status: { in: ["OUVERTE", "EN_EXAMEN"] } } }),
  ]);

  const gmv = ordersRecent.reduce((s, o) => s + o.total, 0);
  const gmvPrev = ordersPrev.reduce((s, o) => s + o.total, 0);
  const commission = itemsRecent.reduce((s, i) => s + (i.lineTotal - i.sellerAmount), 0);
  const commissionPrev = itemsPrev.reduce((s, i) => s + (i.lineTotal - i.sellerAmount), 0);
  const basket = ordersRecent.length ? Math.round(gmv / ordersRecent.length) : 0;
  const basketPrev = ordersPrev.length ? Math.round(gmvPrev / ordersPrev.length) : 0;
  const conformity = reviewAgg._count ? Math.round((reviewConform / reviewAgg._count) * 100) : 100;

  const weekly = weeklySeries(ordersForChart.map((o) => ({ date: o.createdAt, amount: o.total })), 12);

  const byVertical = (["MOBILIER"] as const).map((v) => {
    const rows = itemsByVertical.filter((i) => i.product.vertical === v);
    return {
      key: v,
      label: VERTICALS[v].label,
      value: rows.reduce((s, i) => s + i.lineTotal, 0),
      detail: `${rows.reduce((s, i) => s + i.quantity, 0)} articles vendus`,
      color: "var(--color-viz-mobilier)",
    };
  });

  const gradeMap = Object.fromEntries(gradeCounts.map((g) => [g.defectGrade, g._count]));

  return (
    <>
      <PageHeader
        title={`Bonjour ${admin.firstName}`}
        subtitle={`Activité des 30 derniers jours · ${new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Brazzaville" })}`}
        action={
          <div className="flex gap-2">
            <Link href="/admin/annonces?statut=EN_ATTENTE" className="btn btn-gold btn-sm">
              <Icon name="check-circle" size={14} /> Valider les annonces
            </Link>
          </div>
        }
      />

      {/* À traiter */}
      {(pendingProducts.length > 0 || pendingSellers.length > 0 || toAssign > 0 || openClaims > 0 || (pendingPayouts._count ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <TodoLink href="/admin/reclamations" icon="shield" count={openClaims} label="réclamation(s) à trancher" />
          <TodoLink href="/admin/annonces?statut=EN_ATTENTE" icon="tag" count={pendingProducts.length} label="annonce(s) à valider" />
          <TodoLink href="/admin/vendeurs?statut=EN_ATTENTE" icon="home" count={pendingSellers.length} label="boutique(s) à activer" />
          <TodoLink href="/admin/livraisons?statut=A_ASSIGNER" icon="truck" count={toAssign} label="livraison(s) sans livreur" />
          <TodoLink
            href="/admin/paiements"
            icon="wallet"
            count={pendingPayouts._count}
            label={`versement(s) · ${moneyCompact(pendingPayouts._sum.amount ?? 0)} F`}
          />
        </div>
      )}

      {/* Indicateurs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Volume d'affaires"
          value={`${moneyCompact(gmv)} F`}
          icon="chart"
          delta={{ pct: deltaPct(gmv, gmvPrev), vs: "vs 30 j précédents" }}
        />
        <Stat
          label="Commissions LBD"
          value={`${moneyCompact(commission)} F`}
          icon="wallet"
          tone="gold"
          delta={{ pct: deltaPct(commission, commissionPrev), vs: "vs 30 j précédents" }}
        />
        <Stat
          label="Commandes"
          value={ordersRecent.length}
          icon="package"
          delta={{ pct: deltaPct(ordersRecent.length, ordersPrev.length), vs: "vs 30 j précédents" }}
        />
        <Stat
          label="Panier moyen"
          value={`${moneyCompact(basket)} F`}
          icon="cart"
          delta={{ pct: deltaPct(basket, basketPrev), vs: "vs 30 j précédents" }}
        />
        <Stat label="Articles en ligne" value={published} icon="tag" href="/admin/annonces?statut=PUBLIE" />
        <Stat
          label="Défaut conforme"
          value={`${conformity} %`}
          icon="shield"
          tone={conformity >= 90 ? "success" : "danger"}
          hint={`${reviewConform} avis sur ${reviewAgg._count} confirment l'annonce`}
        />
        <Stat
          label="Note moyenne"
          value={(reviewAgg._avg.rating ?? 0).toFixed(1).replace(".", ",")}
          icon="star"
          hint="sur 5, tous articles confondus"
        />
        <Stat
          label="Nouveaux comptes"
          value={newUsers}
          icon="users"
          href="/admin/utilisateurs"
          delta={{ pct: deltaPct(newUsers, newUsersPrev), vs: "vs 30 j précédents" }}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 mb-6">
        <Card>
          <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="font-display text-lg font-bold">Volume d&apos;affaires par semaine</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">12 dernières semaines · commandes non annulées, en FCFA</p>
            </div>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Total{" "}
              <strong className="text-[var(--color-ink)]">{money(weekly.reduce((s, w) => s + w.value, 0))}</strong>
            </p>
          </div>
          <ColumnChart data={weekly} caption="Volume d'affaires hebdomadaire sur 12 semaines" height={230} />
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="font-display text-lg font-bold">Ventes par univers</h2>
            <p className="text-xs text-[var(--color-ink-muted)] mb-4">Part du chiffre d&apos;affaires depuis l&apos;ouverture</p>
            <ShareBar parts={byVertical} caption="Répartition des ventes par univers" />
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold">Articles en ligne par grade</h2>
            <p className="text-xs text-[var(--color-ink-muted)] mb-4">Transparence du catalogue actuel</p>
            <BarList
              caption="Nombre d'articles publiés par grade de défaut"
              rows={GRADE_LIST.map((g) => ({
                key: g.key,
                label: g.name,
                value: gradeMap[g.key] ?? 0,
                detail: `Remise attendue ${g.minDiscount} à ${g.maxDiscount} %`,
              }))}
              prefix={Object.fromEntries(GRADE_LIST.map((g) => [g.key, <GradeBadge key={g.key} grade={g.key} size="sm" />]))}
            />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
        {/* Dernières commandes */}
        <Card padded={false}>
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-display text-lg font-bold">Dernières commandes</h2>
            <Link href="/admin/commandes" className="btn btn-ghost btn-sm">
              Toutes <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="table-lbd">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client</th>
                  <th>Statut</th>
                  <th className="!text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/commandes/${o.id}`} className="font-mono text-xs hover:text-[var(--color-gold-dark)]">
                        {o.reference}
                      </Link>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">{relativeFR(o.createdAt)}</p>
                    </td>
                    <td>
                      {o.buyer.firstName} {o.buyer.lastName}
                      <p className="text-[11px] text-[var(--color-ink-muted)]">
                        {o.items.length} article{o.items.length > 1 ? "s" : ""} · {o.city}
                      </p>
                    </td>
                    <td>
                      <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    </td>
                    <td className="text-right font-semibold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* File de modération */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">File de modération</h2>
            <Link href="/admin/annonces?statut=EN_ATTENTE" className="btn btn-ghost btn-sm">
              Tout <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          {pendingProducts.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)] py-6 text-center">
              <Icon name="check-circle" size={22} className="mx-auto mb-2 text-[var(--color-success)]" />
              Aucune annonce en attente.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendingProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/annonces/${p.id}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-[var(--color-cream-deep)] transition-colors"
                  >
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)] truncate">
                        {p.seller.seller?.shopName} · {relativeFR(p.createdAt)}
                      </p>
                    </div>
                    <GradeBadge grade={p.defectGrade} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {pendingSellers.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--color-sand)]">
              <p className="label">Boutiques en attente</p>
              <ul className="flex flex-col gap-2">
                {pendingSellers.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {s.shopName}{" "}
                      <span className="text-[var(--color-ink-muted)] text-xs">
                        · {s.user.firstName} {s.user.lastName}
                      </span>
                    </span>
                    <Link href="/admin/vendeurs?statut=EN_ATTENTE" className="btn btn-outline btn-sm">
                      Examiner
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

function TodoLink({
  href,
  icon,
  count,
  label,
}: {
  href: string;
  icon: "tag" | "home" | "truck" | "wallet" | "shield";
  count: number;
  label: string;
}) {
  if (!count) return null;
  return (
    <Link
      href={href}
      className="surface surface-hover flex items-center gap-3 px-4 py-3 border-l-4 !border-l-[var(--color-gold)]"
    >
      <Icon name={icon} size={17} className="text-[var(--color-gold-deep)]" />
      <span className="text-sm flex-1">
        <strong className="font-semibold">{count}</strong> {label}
      </span>
      <Icon name="chevron-right" size={15} className="opacity-40" />
    </Link>
  );
}
