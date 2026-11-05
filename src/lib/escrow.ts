import type { Prisma } from "@prisma/client";
import { ESCROW_RELEASE_DAYS } from "./constants";

/**
 * Le séquestre sécurise les paiements quand une commande doit être vérifiée.
 * Pour le mobilier vendu par Le Beau Défaut, l'argent est déjà dans notre logique
 * de vente : aucun versement de tiers n'est à bloquer.
 */

type Tx = Prisma.TransactionClient;

type OrderLike = {
  id: string;
  items: { sellerId: string; lineTotal: number; sellerAmount: number }[];
};

/** Date à laquelle l'argent part au vendeur sans intervention de l'acheteur. */
export function escrowDueDate(deliveredAt: Date | null | undefined): Date | null {
  if (!deliveredAt) return null;
  const due = new Date(deliveredAt);
  due.setDate(due.getDate() + ESCROW_RELEASE_DAYS);
  return due;
}

export function escrowIsDue(deliveredAt: Date | null | undefined): boolean {
  const due = escrowDueDate(deliveredAt);
  return due !== null && due.getTime() <= Date.now();
}

/**
 * Prépare les versements d'une commande livrée.
 * Boutique maison : rien (l'argent nous appartient déjà).
 * Vendeur extérieur : versement créé sous séquestre, débloqué à la confirmation.
 */
export async function createPayoutsForOrder(tx: Tx, order: OrderLike) {
  const bySeller = new Map<string, number>();
  for (const item of order.items) {
    bySeller.set(item.sellerId, (bySeller.get(item.sellerId) ?? 0) + item.sellerAmount);
  }

  let heldTotal = 0;

  for (const [sellerUserId, amount] of bySeller) {
    const profile = await tx.sellerProfile.findUnique({ where: { userId: sellerUserId } });
    if (!profile) continue;

    const gross = order.items.filter((i) => i.sellerId === sellerUserId).reduce((s, i) => s + i.lineTotal, 0);

    // Les ventes de la boutique maison alimentent le chiffre d'affaires, sans versement.
    await tx.sellerProfile.update({ where: { id: profile.id }, data: { totalSales: { increment: gross } } });
    if (profile.isHouse) continue;

    if (await tx.payout.findFirst({ where: { orderId: order.id, sellerId: profile.id } })) continue;

    await tx.payout.create({
      data: {
        sellerId: profile.id,
        orderId: order.id,
        amount,
        commission: gross - amount,
        status: "SEQUESTRE",
      },
    });
    heldTotal += gross;
  }

  if (heldTotal > 0) {
    await tx.order.update({
      where: { id: order.id },
      data: { escrowStatus: "SOUS_SEQUESTRE", escrowAmount: heldTotal },
    });
  }

  return heldTotal;
}

/**
 * Libère le séquestre : les versements deviennent exigibles et le vendeur est prévenu.
 * `reason` apparaît dans le suivi de la commande.
 */
export async function releaseEscrowForOrder(tx: Tx, orderId: string, reason: string, actorId?: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, reference: true, escrowStatus: true, buyerId: true },
  });
  if (!order || order.escrowStatus !== "SOUS_SEQUESTRE") return false;

  const held = await tx.payout.findMany({
    where: { orderId, status: "SEQUESTRE" },
    include: { seller: { select: { userId: true, shopName: true } } },
  });

  await tx.payout.updateMany({ where: { orderId, status: "SEQUESTRE" }, data: { status: "EN_ATTENTE" } });
  await tx.order.update({
    where: { id: orderId },
    data: { escrowStatus: "LIBERE", releasedAt: new Date(), ...(actorId ? { buyerConfirmedAt: new Date() } : {}) },
  });

  await tx.orderEvent.create({
    data: { orderId, status: "LIVREE", label: "Fonds libérés", note: reason, actorId: actorId ?? null },
  });

  for (const payout of held) {
    await tx.notification.create({
      data: {
        userId: payout.seller.userId,
        type: "VERSEMENT",
        title: "Votre argent est débloqué",
        body: `Commande ${order.reference} : ${payout.amount.toLocaleString("fr-FR")} FCFA seront versés sur votre Mobile Money.`,
        link: "/vendeur/paiements",
      },
    });
  }

  return true;
}

/** Rend l'argent à l'acheteur (réclamation acceptée, commande annulée après paiement). */
export async function refundEscrowForOrder(tx: Tx, orderId: string) {
  await tx.payout.updateMany({ where: { orderId, status: "SEQUESTRE" }, data: { status: "ANNULE" } });
  await tx.order.update({ where: { id: orderId }, data: { escrowStatus: "REMBOURSE", releasedAt: new Date() } });
}
