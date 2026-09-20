import Link from "next/link";
import { ESCROW_RELEASE_DAYS } from "@/lib/constants";
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

  const [payouts, pending, paid, inTransit, held] = await Promise.all([
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
    prisma.payout.aggregate({ where: { sellerId: shop.id, status: "SEQUESTRE" }, _sum: { amount: true }, _count: true }),
  ]);

  return (
    <>
      <PageHeader
        title="Versements"
        subtitle={shop.isHouse
          ? "Boutique maison : les ventes de notre propre stock n'ouvrent pas de versement."
          : `L'acheteur paie Le Beau Défaut. L'argent vous est versé dès qu'il confirme la réception, au plus tard ${ESCROW_RELEASE_DAYS} jours après la livraison.`}
      />

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

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
        <Stat label="En cours de livraison" value={money(inTransit._sum.sellerAmount ?? 0)} hint="L'acheteur n'a pas encore reçu" icon="truck" />
        <Stat
          label="Sous séquestre"
          value={money(held._sum.amount ?? 0)}
          hint={`${held._count} vente(s) livrée(s), en attente de confirmation`}
          icon="shield"
        />
        <Stat label="À recevoir" value={money(pending._sum.amount ?? 0)} hint="Débloqué, envoi sous 48 h ouvrées" icon="wallet" tone="gold" />
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
                    <Badge tone={p.status === "PAYE" ? "success" : p.status === "SEQUESTRE" ? "info" : p.status === "ANNULE" ? "danger" : "warning"}>
                      {p.status === "PAYE" ? "Reçu" : p.status === "SEQUESTRE" ? "Sous séquestre" : p.status === "ANNULE" ? "Remboursé à l'acheteur" : "Débloqué"}
                    </Badge>
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
