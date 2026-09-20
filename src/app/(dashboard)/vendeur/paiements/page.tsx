import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth";
import { money, dateFR, phoneFR } from "@/lib/format";
import { PageHeader, Stat, Badge, EmptyState, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Versements" };

export default async function SellerPayoutsPage() {
  const user = await requireSeller("/vendeur/paiements");
  const shop = user.seller;

  if (!shop) {
    return (
      <>
        <PageHeader title="Versements" />
        <EmptyState icon="wallet" title="Aucune boutique associée à ce compte" />
      </>
    );
  }

  const [payouts, pending, paid, inTransit] = await Promise.all([
    prisma.payout.findMany({
      where: { sellerId: shop.id },
      include: { order: { select: { reference: true, deliveredAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.aggregate({ where: { sellerId: shop.id, status: "EN_ATTENTE" }, _sum: { amount: true } }),
    prisma.payout.aggregate({ where: { sellerId: shop.id, status: "PAYE" }, _sum: { amount: true, commission: true } }),
    prisma.orderItem.aggregate({
      where: { sellerId: user.id, order: { status: { in: ["PAYEE", "CONFIRMEE", "EN_PREPARATION", "EN_LIVRAISON"] } } },
      _sum: { sellerAmount: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="Versements" subtitle="Vous êtes payé par Mobile Money après chaque livraison réussie." />

      {!shop.mobileMoney && (
        <div className="mb-5">
          <Alert tone="warning" title="Numéro de versement manquant">
            Renseignez votre numéro MTN MoMo ou Airtel Money pour recevoir vos paiements.{" "}
            <Link href="/vendeur/boutique" className="underline font-medium">
              Compléter ma boutique
            </Link>
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <Stat label="En cours de livraison" value={money(inTransit._sum.sellerAmount ?? 0)} hint="Versé après livraison" icon="truck" />
        <Stat label="À recevoir" value={money(pending._sum.amount ?? 0)} hint="Sous 48 h ouvrées" icon="wallet" tone="gold" />
        <Stat label="Déjà reçu" value={money(paid._sum.amount ?? 0)} icon="check-circle" tone="success" />
        <Stat
          label="Compte de versement"
          value={shop.mobileMoneyOp ?? "—"}
          hint={phoneFR(shop.mobileMoney)}
          icon="phone"
          href="/vendeur/boutique"
        />
      </div>

      {payouts.length === 0 ? (
        <EmptyState icon="wallet" title="Aucun versement pour l'instant" message="Votre premier versement apparaîtra après votre première livraison." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="table-lbd">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Livrée le</th>
                <th className="!text-right">Commission LBD</th>
                <th className="!text-right">Montant net</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.order?.reference ?? "—"}</td>
                  <td className="text-sm">{dateFR(p.order?.deliveredAt)}</td>
                  <td className="text-right text-[var(--color-ink-muted)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(p.commission)}
                  </td>
                  <td className="text-right font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(p.amount)}
                  </td>
                  <td>
                    <Badge tone={p.status === "PAYE" ? "success" : "warning"}>{p.status === "PAYE" ? "Reçu" : "En attente"}</Badge>
                    {p.paidAt && (
                      <span className="text-[11px] text-[var(--color-ink-muted)] ml-2">
                        {dateFR(p.paidAt)} {p.reference && `· ${p.reference}`}
                      </span>
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
