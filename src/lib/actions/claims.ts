"use server";

import { revalidatePath } from "next/cache";
import { refundEscrowForOrder, releaseEscrowForOrder } from "@/lib/escrow";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";
import { saveImage } from "@/lib/upload";
import { CLAIM_TYPES, CLAIM_WINDOW_DAYS } from "@/lib/constants";

type State = { error?: string; success?: string } | undefined;

async function nextClaimReference() {
  const year = new Date().getFullYear();
  const count = await prisma.claim.count();
  return `REC-${year}-${String(count + 1).padStart(5, "0")}`;
}

/** Côté client : signaler un écart entre l'annonce et l'article reçu. */
export async function createClaimAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") || "");
  const orderItemId = String(formData.get("orderItemId") || "") || null;
  const type = String(formData.get("type") || "");
  const description = String(formData.get("description") || "").trim();

  if (!CLAIM_TYPES.some((t) => t.key === type)) return { error: "Choisissez le type de problème." };
  if (description.length < 20) return { error: "Décrivez le problème en 20 caractères minimum, c'est ce qui nous permet de trancher." };

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    include: { items: true, claims: true },
  });
  if (!order) return { error: "Commande introuvable." };
  if (order.status !== "LIVREE") return { error: "Une réclamation se fait après la livraison." };
  if (order.claims.some((c) => ["OUVERTE", "EN_EXAMEN"].includes(c.status))) {
    return { error: "Une réclamation est déjà en cours sur cette commande." };
  }
  if (orderItemId && !order.items.some((i) => i.id === orderItemId)) {
    return { error: "Article introuvable dans cette commande." };
  }

  const photoUrl = await saveImage(formData.get("photo") as File | null);
  const reference = await nextClaimReference();

  const claim = await prisma.claim.create({
    data: { reference, orderId, orderItemId, buyerId: user.id, type, description, photoUrl },
  });

  await prisma.orderEvent.create({
    data: {
      orderId,
      status: order.status,
      label: "Réclamation ouverte",
      note: `${reference} — ${CLAIM_TYPES.find((t) => t.key === type)?.label}`,
      actorId: user.id,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: "SYSTEME",
      title: "Nouvelle réclamation",
      body: `${reference} sur la commande ${order.reference}.`,
      link: `/admin/reclamations`,
    })),
  });

  // Le vendeur concerné est informé : sa note de conformité en dépend.
  const sellerIds = [
    ...new Set(order.items.filter((i) => !orderItemId || i.id === orderItemId).map((i) => i.sellerId)),
  ];
  await prisma.notification.createMany({
    data: sellerIds.map((sellerId) => ({
      userId: sellerId,
      type: "SYSTEME",
      title: "Réclamation sur une de vos ventes",
      body: `Commande ${order.reference} : un acheteur signale un écart avec l'annonce.`,
      link: "/vendeur/ventes",
    })),
  });

  revalidatePath("/", "layout");
  return { success: `Réclamation ${claim.reference} enregistrée. Nous revenons vers vous sous 48 h.` };
}

/** Côté administration : trancher la réclamation. */
export async function resolveClaimAction(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();
  const claimId = String(formData.get("claimId") || "");
  const status = String(formData.get("status") || "");
  const resolution = String(formData.get("resolution") || "") || null;
  const refundAmount = Math.max(0, Number(formData.get("refundAmount") || 0));
  const adminNote = String(formData.get("adminNote") || "").trim() || null;

  if (!["EN_EXAMEN", "ACCEPTEE", "REFUSEE", "CLOTUREE"].includes(status)) return { error: "Décision invalide." };

  const claim = await prisma.claim.findUnique({ where: { id: claimId }, include: { order: true } });
  if (!claim) return { error: "Réclamation introuvable." };
  if (status === "ACCEPTEE" && !resolution) return { error: "Choisissez la suite donnée (remboursement, reprise…)." };
  if (refundAmount > claim.order.total) return { error: "Le remboursement dépasse le montant de la commande." };

  await prisma.$transaction(async (tx) => {
    await tx.claim.update({
      where: { id: claimId },
      data: {
        status,
        resolution,
        refundAmount,
        adminNote,
        handledById: admin.id,
        handledAt: new Date(),
      },
    });

    // Remboursement total : la commande passe en « remboursée ».
    if (status === "ACCEPTEE" && refundAmount >= claim.order.total) {
      await tx.order.update({
        where: { id: claim.orderId },
        data: { status: "REMBOURSEE", paymentStatus: "REMBOURSE" },
      });
    }

    // Réclamation acceptée avec remboursement : l'argent retenu ne part pas au vendeur.
    if (status === "ACCEPTEE" && refundAmount > 0) {
      await refundEscrowForOrder(tx, claim.orderId);
    }
    // Réclamation écartée : le séquestre reprend son cours normal.
    if (status === "REFUSEE") {
      await releaseEscrowForOrder(tx, claim.orderId, "Réclamation examinée et écartée.");
    }

    if (["ACCEPTEE", "REFUSEE"].includes(status)) {
      await tx.orderEvent.create({
        data: {
          orderId: claim.orderId,
          status: claim.order.status,
          label: status === "ACCEPTEE" ? "Réclamation acceptée" : "Réclamation refusée",
          note: adminNote,
          actorId: admin.id,
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: claim.buyerId,
        type: "SYSTEME",
        title: `Réclamation ${claim.reference}`,
        body:
          status === "ACCEPTEE"
            ? `Acceptée${refundAmount ? ` — remboursement de ${refundAmount} FCFA` : ""}.`
            : status === "REFUSEE"
              ? `Non retenue. ${adminNote ?? ""}`.trim()
              : "Votre réclamation est en cours d'examen.",
        link: `/compte/commandes/${claim.orderId}`,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        action: "RECLAMATION",
        entity: "Claim",
        entityId: claim.reference,
        details: `${status}${resolution ? ` · ${resolution}` : ""}${refundAmount ? ` · ${refundAmount} FCFA` : ""}`,
      },
    });
  });

  revalidatePath("/", "layout");
  return { success: "Décision enregistrée et acheteur notifié." };
}
