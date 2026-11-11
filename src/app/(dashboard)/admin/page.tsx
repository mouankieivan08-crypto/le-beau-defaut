import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, moneyCompact, relativeFR, phoneFR, waLink } from "@/lib/format";
import { weeklySeries, daysAgo, deltaPct, LIVE_ORDER } from "@/lib/stats";
import {
  GRADE_LIST,
  ORDER_STATUS,
  VERTICALS,
  CLAIM_STATUS,
  SUPPORT_PREFIX,
  REPORT_PREFIX,
  claimTypeLabel,
  threadKind,
} from "@/lib/constants";
import { confirmDepositAction } from "@/lib/actions/admin";
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
    proofOrders,
    awaitingNoProof,
    openThreads,
    recentClaims,
    todayOrders,
    todayPaid,
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
    prisma.order.findMany({
      where: { status: "EN_ATTENTE_PAIEMENT", paymentStatus: "EN_ATTENTE", paymentDeclaredAt: { not: null } },
      include: {
        buyer: { select: { firstName: true, lastName: true, phone: true } },
        items: { select: { titleSnapshot: true, quantity: true, imageSnapshot: true } },
      },
      orderBy: { paymentDeclaredAt: "asc" },
      take: 6,
    }),
    prisma.order.count({ where: { status: "EN_ATTENTE_PAIEMENT", paymentStatus: "EN_ATTENTE", paymentDeclaredAt: null } }),
    prisma.thread.findMany({
      where: { isClosed: false, OR: [{ subject: { startsWith: SUPPORT_PREFIX } }, { subject: { startsWith: REPORT_PREFIX } }] },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { firstName: true, lastName: true, role: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.claim.findMany({
      where: { status: { in: ["OUVERTE", "EN_EXAMEN"] } },
      include: { buyer: { select: { firstName: true, lastName: true } }, order: { select: { id: true, reference: true } } },
      orderBy: { createdAt: "asc" },
      take: 4,
    }),
    prisma.order.count({ where: { createdAt: { gte: daysAgo(1) } } }),
    prisma.order.aggregate({ where: { paidAt: { gte: daysAgo(1) } }, _sum: { total: true }, _count: true }),
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
            <Link href="/admin/commandes?statut=A_CONFIRMER" className="btn btn-gold btn-sm">
              <Icon name="wallet" size={14} /> Confirmer les paiements
            </Link>
            <Link href="/admin/support" className="btn btn-outline btn-sm">
              <Icon name="message" size={14} /> Support
            </Link>
          </div>
        }
      />

      {/* Aujourd'hui */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <Stat label="Commandes (24 h)" value={todayOrders} icon="package" href="/admin/commandes" />
        <Stat label="Encaissé (24 h)" value={money(todayPaid._sum.total ?? 0)} icon="wallet" tone="gold" hint={`${todayPaid._count} paiement(s) confirmé(s)`} />
        <Stat
          label="Preuves à vérifier"
          value={proofOrders.length}
          icon="check-circle"
          tone={proofOrders.length ? "danger" : "success"}
          href="/admin/commandes?statut=A_CONFIRMER"
        />
        <Stat label="Paiements attendus" value={awaitingNoProof} icon="clock" hint="commandes sans preuve encore" href="/admin/commandes?statut=EN_ATTENTE_PAIEMENT" />
      </div>

      {/* Commandes à confirmer : la file principale de l'équipe */}
      <Card className="mb-6" padded={false}>
        <div className="flex items-center justify-between gap-3 p-5 pb-3 flex-wrap">
          <div>
            <h2 className="font-display text-lg font-bold">Commandes à confirmer</h2>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Le client a envoyé sa preuve de dépôt Mobile Money. Vérifiez-la (ici ou sur WhatsApp), puis confirmez : il est notifié.
            </p>
          </div>
          <Link href="/admin/commandes?statut=A_CONFIRMER" className="btn btn-ghost btn-sm">
            Toutes <Icon name="arrow-right" size={13} />
          </Link>
        </div>
        {proofOrders.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-muted)] px-5 pb-6 text-center">
            <Icon name="check-circle" size={22} className="mx-auto mb-2 text-[var(--color-success)]" />
            Aucune preuve en attente. Les commandes sans preuve sont dans « Paiements attendus ».
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-sand)]">
            {proofOrders.map((o) => {
              const wa = waLink(o.recipientPhone || o.buyer.phone, `Bonjour ${o.buyer.firstName}, c'est Le Beau Défaut au sujet de votre commande ${o.reference}.`);
              return (
                <li key={o.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
                  {o.paymentProofUrl ? (
                    <a href={o.paymentProofUrl} target="_blank" rel="noreferrer" title="Voir la capture">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={o.paymentProofUrl} alt="Preuve" className="h-12 w-12 rounded-lg object-cover border border-[var(--color-sand)]" />
                    </a>
                  ) : (
                    <span className="h-12 w-12 rounded-lg border border-dashed border-[var(--color-sand)] grid place-items-center text-[10px] text-[var(--color-ink-muted)]">
                      réf.
                    </span>
                  )}
                  <div className="min-w-[180px] flex-1">
                    <p className="text-sm">
                      <Link href={`/admin/commandes/${o.id}`} className="font-semibold hover:text-[var(--color-gold-dark)]">
                        {o.buyer.firstName} {o.buyer.lastName}
                      </Link>{" "}
                      <span className="font-mono text-[11px] text-[var(--color-ink-muted)]">{o.reference}</span>
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] truncate">
                      {o.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(" · ")}
                    </p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {phoneFR(o.recipientPhone || o.buyer.phone)} · preuve {relativeFR(o.paymentDeclaredAt)}
                      {o.paymentRef ? ` · transaction ${o.paymentRef}` : ""}
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(o.total)}
                  </p>
                  <div className="flex gap-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" title="WhatsApp du client">
                        <Icon name="phone" size={13} />
                      </a>
                    )}
                    <form action={confirmDepositAction}>
                      <input type="hidden" name="orderId" value={o.id} />
                      <button className="btn btn-sm !bg-[var(--color-grade-a)] !text-white whitespace-nowrap">
                        <Icon name="check" size={13} /> Confirmer
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Support & réclamations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Support & signalements</h2>
            <Link href="/admin/support" className="btn btn-ghost btn-sm">
              Tout <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          {openThreads.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)] py-4 text-center">Aucune demande ouverte.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {openThreads.map((t) => {
                const last = t.messages[0];
                const kind = threadKind(t.subject);
                const waiting = last && last.sender.role !== "ADMIN";
                return (
                  <li key={t.id}>
                    <Link href={`/admin/support/${t.id}`} className="flex items-start gap-2 p-2 -mx-2 rounded-xl hover:bg-[var(--color-cream-deep)]">
                      <Badge tone={kind === "SIGNALEMENT" ? "danger" : "info"}>{kind === "SIGNALEMENT" ? "Signalement" : "Support"}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${waiting ? "font-semibold" : ""}`}>
                          {last ? `${last.sender.firstName} ${last.sender.lastName}` : "—"} ·{" "}
                          <span className="text-[var(--color-ink-muted)] font-normal">{t.subject.replace(SUPPORT_PREFIX, "").replace(REPORT_PREFIX, "")}</span>
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)] truncate">{last?.body}</p>
                      </div>
                      <span className="text-[11px] text-[var(--color-ink-muted)] whitespace-nowrap">{last ? relativeFR(last.createdAt) : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold">Réclamations à trancher</h2>
            <Link href="/admin/reclamations" className="btn btn-ghost btn-sm">
              Tout <Icon name="arrow-right" size={13} />
            </Link>
          </div>
          {recentClaims.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-muted)] py-4 text-center">Aucune réclamation ouverte.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {recentClaims.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/commandes/${c.order.id}`} className="flex items-start gap-2 p-2 -mx-2 rounded-xl hover:bg-[var(--color-cream-deep)]">
                    <Badge tone={CLAIM_STATUS[c.status]?.tone ?? "neutral"}>{CLAIM_STATUS[c.status]?.label ?? c.status}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate">
                        {c.buyer.firstName} {c.buyer.lastName} · <span className="text-[var(--color-ink-muted)]">{claimTypeLabel(c.type)}</span>
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)] truncate">
                        {c.order.reference} — {c.description}
                      </p>
                    </div>
                    <span className="text-[11px] text-[var(--color-ink-muted)] whitespace-nowrap">{relativeFR(c.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Autres choses à traiter */}
      {(pendingProducts.length > 0 || toAssign > 0 || openClaims > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <TodoLink href="/admin/reclamations" icon="shield" count={openClaims} label="réclamation(s) à trancher" />
          <TodoLink href="/admin/annonces?statut=EN_ATTENTE" icon="tag" count={pendingProducts.length} label="annonce(s) à valider" />
          <TodoLink href="/admin/livraisons?statut=A_ASSIGNER" icon="truck" count={toAssign} label="livraison(s) sans livreur" />
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
                        <span className="font-mono">{p.reference}</span> · {relativeFR(p.createdAt)}
                      </p>
                    </div>
                    <GradeBadge grade={p.defectGrade} size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
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
