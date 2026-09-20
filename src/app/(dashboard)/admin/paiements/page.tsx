import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateFR, phoneFR } from "@/lib/format";
import { markPayoutPaidAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, PageHeader, Stat, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Versements" };

export default async function AdminPayoutsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin("/admin/paiements");
  const { statut = "EN_ATTENTE" } = await searchParams;

  const [payouts, pending, paid, commissions] = await Promise.all([
    prisma.payout.findMany({
      where: statut === "TOUT" ? {} : { status: statut },
      include: {
        seller: { select: { shopName: true, mobileMoney: true, mobileMoneyOp: true } },
        order: { select: { id: true, reference: true, deliveredAt: true } },
      },
      orderBy: { createdAt: statut === "EN_ATTENTE" ? "asc" : "desc" },
      take: 100,
    }),
    prisma.payout.aggregate({ where: { status: "EN_ATTENTE" }, _sum: { amount: true }, _count: true }),
    prisma.payout.aggregate({ where: { status: "PAYE" }, _sum: { amount: true }, _count: true }),
    prisma.payout.aggregate({ _sum: { commission: true } }),
  ]);

  // Regroupement des versements en attente par vendeur (un seul transfert Mobile Money par boutique)
  const bySeller = new Map<string, { shop: string; momo: string | null; op: string | null; total: number; count: number }>();
  if (statut === "EN_ATTENTE") {
    for (const p of payouts) {
      const cur = bySeller.get(p.sellerId) ?? { shop: p.seller.shopName, momo: p.seller.mobileMoney, op: p.seller.mobileMoneyOp, total: 0, count: 0 };
      cur.total += p.amount;
      cur.count += 1;
      bySeller.set(p.sellerId, cur);
    }
  }

  return (
    <>
      <PageHeader
        title="Versements vendeurs"
        subtitle="Le vendeur est payé après la livraison, commission Le Beau Défaut déduite."
        action={
          <a href="/api/export/versements" className="btn btn-outline btn-sm" download>
            <Icon name="download" size={14} /> Export Excel
          </a>
        }
      />

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
        <Stat label="À verser" value={money(pending._sum.amount ?? 0)} hint={`${pending._count} versement(s)`} icon="wallet" tone="gold" />
        <Stat label="Déjà versé" value={money(paid._sum.amount ?? 0)} hint={`${paid._count} versement(s)`} icon="check-circle" tone="success" />
        <Stat label="Commissions générées" value={money(commissions._sum.commission ?? 0)} icon="chart" />
      </div>

      {bySeller.size > 0 && (
        <div className="surface p-5 mb-6">
          <h2 className="font-display text-lg font-bold mb-3">À envoyer par boutique</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...bySeller.values()].map((s) => (
              <li key={s.shop} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-cream-deep)]/60">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{s.shop}</p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {s.op ?? "Mobile Money"} {phoneFR(s.momo)} · {s.count} commande(s)
                  </p>
                </div>
                <p className="font-semibold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {money(s.total)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-1.5 mb-4">
        {[
          { key: "EN_ATTENTE", label: "À verser" },
          { key: "PAYE", label: "Versés" },
          { key: "TOUT", label: "Tous" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/admin/paiements?statut=${t.key}`}
            className={`chip !text-xs !px-3 !py-1.5 ${
              statut === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {payouts.length === 0 ? (
        <EmptyState icon="wallet" title="Aucun versement" message="Tout est à jour." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="table-lbd">
            <thead>
              <tr>
                <th>Boutique</th>
                <th>Commande</th>
                <th className="!text-right">Commission</th>
                <th className="!text-right">Montant</th>
                <th>Statut</th>
                <th className="!text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium">{p.seller.shopName}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {p.seller.mobileMoneyOp ?? "—"} {phoneFR(p.seller.mobileMoney)}
                    </p>
                  </td>
                  <td>
                    {p.order ? (
                      <Link href={`/admin/commandes/${p.order.id}`} className="font-mono text-xs hover:text-[var(--color-gold-dark)]">
                        {p.order.reference}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <p className="text-[11px] text-[var(--color-ink-muted)]">Livrée le {dateFR(p.order?.deliveredAt)}</p>
                  </td>
                  <td className="text-right text-[var(--color-ink-muted)] whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(p.commission)}
                  </td>
                  <td className="text-right font-semibold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(p.amount)}
                  </td>
                  <td>
                    <Badge tone={p.status === "PAYE" ? "success" : p.status === "SEQUESTRE" ? "info" : p.status === "ANNULE" ? "danger" : "warning"}>
                      {p.status === "PAYE" ? "Versé" : p.status === "SEQUESTRE" ? "Sous séquestre" : p.status === "ANNULE" ? "Annulé" : "À verser"}
                    </Badge>
                    {p.paidAt && <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">{dateFR(p.paidAt)}</p>}
                    {p.reference && <p className="text-[11px] text-[var(--color-ink-muted)] font-mono">{p.reference}</p>}
                  </td>
                  <td className="text-right">
                    {p.status === "EN_ATTENTE" && (
                      <form action={markPayoutPaidAction} className="flex items-center justify-end gap-1.5">
                        <input type="hidden" name="payoutId" value={p.id} />
                        <input name="reference" placeholder="Réf. transfert" className="field !py-1 !w-32 text-xs" />
                        <button className="btn btn-sm !bg-[var(--color-grade-a)] !text-white">
                          <Icon name="check" size={13} /> Versé
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
