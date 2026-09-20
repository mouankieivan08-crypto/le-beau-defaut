import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateFR, dateTimeFR } from "@/lib/format";
import { ESCROW_RELEASE_DAYS, ESCROW_STATUS } from "@/lib/constants";
import { escrowDueDate, escrowIsDue } from "@/lib/escrow";
import { releaseEscrowAction, releaseDueEscrowsAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, PageHeader, Stat, EmptyState, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Séquestre" };

const TABS = [
  { key: "SOUS_SEQUESTRE", label: "Argent conservé" },
  { key: "LIBERE", label: "Versés" },
  { key: "REMBOURSE", label: "Remboursés" },
];

export default async function EscrowPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin("/admin/sequestre");
  const { statut = "SOUS_SEQUESTRE" } = await searchParams;

  const [orders, held, released, counts] = await Promise.all([
    prisma.order.findMany({
      where: { escrowStatus: statut },
      include: {
        buyer: { select: { firstName: true, lastName: true } },
        items: { select: { titleSnapshot: true, sellerId: true, sellerAmount: true } },
        claims: { select: { reference: true, status: true } },
        payouts: { include: { seller: { select: { shopName: true, mobileMoney: true, mobileMoneyOp: true } } } },
      },
      orderBy: { deliveredAt: "asc" },
      take: 100,
    }),
    prisma.order.aggregate({ where: { escrowStatus: "SOUS_SEQUESTRE" }, _sum: { escrowAmount: true }, _count: true }),
    prisma.order.aggregate({ where: { escrowStatus: "LIBERE" }, _sum: { escrowAmount: true }, _count: true }),
    prisma.order.groupBy({ by: ["escrowStatus"], _count: true }),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.escrowStatus, c._count])) as Record<string, number>;
  const dueNow = orders.filter(
    (o) =>
      o.escrowStatus === "SOUS_SEQUESTRE" &&
      o.status === "LIVREE" &&
      escrowIsDue(o.deliveredAt) &&
      !o.claims.some((c) => ["OUVERTE", "EN_EXAMEN"].includes(c.status))
  );

  return (
    <>
      <PageHeader
        title="Séquestre"
        subtitle={`L'argent des ventes entre particuliers dort ici jusqu'à la réception, puis ${ESCROW_RELEASE_DAYS} jours de délai de réclamation.`}
        action={
          dueNow.length > 0 ? (
            <form action={releaseDueEscrowsAction}>
              <button className="btn btn-gold btn-sm">
                <Icon name="check-circle" size={14} /> Libérer les {dueNow.length} commande(s) échue(s)
              </button>
            </form>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
        <Stat
          label="Argent conservé"
          value={money(held._sum.escrowAmount ?? 0)}
          hint={`${held._count} commande(s)`}
          icon="shield"
          tone="gold"
        />
        <Stat label="À libérer maintenant" value={dueNow.length} hint="délai écoulé, aucune réclamation" icon="clock" />
        <Stat
          label="Déjà versé aux vendeurs"
          value={money(released._sum.escrowAmount ?? 0)}
          hint={`${released._count} commande(s)`}
          icon="check-circle"
          tone="success"
        />
      </div>

      {dueNow.length > 0 && (
        <div className="mb-5">
          <Alert tone="warning" title="Des vendeurs attendent leur argent">
            {dueNow.length} commande(s) ont dépassé le délai de {ESCROW_RELEASE_DAYS} jours sans réclamation.
            Le bouton ci-dessus les libère toutes d&apos;un coup ; les versements passent alors dans « à verser ».
          </Alert>
        </div>
      )}

      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/sequestre?statut=${t.key}`}
            className={`chip !text-xs !px-3 !py-1.5 ${
              statut === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)]"
            }`}
          >
            {t.label} <span className="opacity-60">{countBy[t.key] ?? 0}</span>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="shield" title="Rien dans cette colonne" message="Aucune commande dans cet état." />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => {
            const due = escrowDueDate(o.deliveredAt);
            const blocked = o.claims.some((c) => ["OUVERTE", "EN_EXAMEN"].includes(c.status));
            const state = ESCROW_STATUS[o.escrowStatus] ?? ESCROW_STATUS.SOUS_SEQUESTRE;
            return (
              <div key={o.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/commandes/${o.id}`} className="font-mono text-xs font-medium hover:text-[var(--color-gold-dark)]">
                        {o.reference}
                      </Link>
                      <Badge tone={state.tone}>{state.label}</Badge>
                      {blocked && <Badge tone="danger">Réclamation en cours</Badge>}
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                      {o.buyer.firstName} {o.buyer.lastName} · {o.items.map((i) => i.titleSnapshot).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(o.escrowAmount)}
                    </p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {o.deliveredAt ? `Livrée le ${dateFR(o.deliveredAt)}` : "Pas encore livrée"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-sand)]">
                  <div className="text-xs text-[var(--color-ink-muted)]">
                    {o.payouts.length > 0 ? (
                      <span>
                        À verser à <strong className="text-[var(--color-ink)]">{o.payouts[0].seller.shopName}</strong>
                        {o.payouts[0].seller.mobileMoneyOp ? ` · ${o.payouts[0].seller.mobileMoneyOp}` : ""} ·{" "}
                        {money(o.payouts.reduce((s, p) => s + p.amount, 0))} net
                      </span>
                    ) : (
                      <span>Versement pas encore préparé (commande non livrée).</span>
                    )}
                    {o.escrowStatus === "SOUS_SEQUESTRE" && due && (
                      <span className="block mt-0.5">
                        Libération automatique prévue le <strong>{dateFR(due)}</strong>
                        {o.buyerConfirmedAt ? ` · confirmée par l'acheteur le ${dateTimeFR(o.buyerConfirmedAt)}` : ""}
                      </span>
                    )}
                    {o.releasedAt && <span className="block mt-0.5">Libéré le {dateTimeFR(o.releasedAt)}</span>}
                  </div>

                  {o.escrowStatus === "SOUS_SEQUESTRE" && o.status === "LIVREE" && (
                    <form action={releaseEscrowAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="orderId" value={o.id} />
                      <input name="reason" placeholder="Motif (facultatif)" className="field !py-1 !w-44 text-xs" />
                      <button className="btn btn-sm btn-outline" disabled={blocked}>
                        <Icon name="check" size={13} /> Libérer
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
