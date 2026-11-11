"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser } from "@/lib/auth";
import {
  DEFAULT_COMMISSION_PCT,
  ONLY_PAYMENT_METHOD,
  SUPPORT_PREFIX,
  REPORT_PREFIX,
  SUPPORT_TOPICS,
  REPORT_REASONS,
} from "@/lib/constants";
import { sanitizeMessage } from "@/lib/safe-message";
import { saveImage } from "@/lib/upload";
import { releaseEscrowForOrder } from "@/lib/escrow";
import { money } from "@/lib/format";

/* ---------------------------- Favoris ---------------------------- */

export async function toggleFavoriteAction(productId: string, pathToRevalidate = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(pathToRevalidate)}`);

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: user.id, productId } });
  }
  revalidatePath("/", "layout");
}

/* ---------------------------- Panier ---------------------------- */

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));
  const back = String(formData.get("back") || "/panier");

  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(back)}`);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "PUBLIE") redirect(back);
  if (product.sellerId === user.id) redirect(back);

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  const wanted = (existing?.quantity ?? 0) + quantity;

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId, quantity: Math.min(quantity, product.quantity) },
    update: { quantity: Math.min(wanted, product.quantity) },
  });

  revalidatePath("/", "layout");
  redirect("/panier");
}

export async function updateCartQuantityAction(formData: FormData) {
  const user = await requireUser("/panier");
  const itemId = String(formData.get("itemId") || "");
  const quantity = Number(formData.get("quantity") || 1);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId: user.id },
    include: { product: true },
  });
  if (!item) return;

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(quantity, item.product.quantity) },
    });
  }
  revalidatePath("/", "layout");
}

export async function removeFromCartAction(formData: FormData) {
  const user = await requireUser("/panier");
  const itemId = String(formData.get("itemId") || "");
  await prisma.cartItem.deleteMany({ where: { id: itemId, userId: user.id } });
  revalidatePath("/", "layout");
}

export async function clearCartAction() {
  const user = await requireUser("/panier");
  await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  revalidatePath("/", "layout");
}

/* ---------------------------- Commande ---------------------------- */

async function nextOrderReference() {
  const year = new Date().getFullYear();
  const count = await prisma.order.count();
  return `LBD-${year}-${String(count + 1).padStart(6, "0")}`;
}

export async function checkoutAction(_prev: { error?: string } | undefined, formData: FormData) {
  const user = await requireUser("/commande");
  if (user.role === "ADMIN") return { error: "Le compte administrateur ne passe pas commande : utilisez un compte client." };

  const recipientName = String(formData.get("recipientName") || "").trim();
  const recipientPhone = String(formData.get("recipientPhone") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const quartier = String(formData.get("quartier") || "").trim();
  const landmark = String(formData.get("landmark") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  // Un seul moyen de paiement : le dépôt Mobile Money. Ce que le formulaire envoie est ignoré.
  const paymentMethod = ONLY_PAYMENT_METHOD;

  if (!recipientName || recipientName.length < 3) return { error: "Nom du destinataire requis." };
  if (recipientPhone.replace(/\D/g, "").length < 9) return { error: "Numéro de téléphone invalide." };
  if (!city || !quartier) return { error: "Ville et quartier requis pour la livraison." };

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: { include: { images: { where: { isCover: true }, take: 1 }, seller: { include: { seller: true } } } } },
  });
  if (items.length === 0) return { error: "Votre panier est vide." };

  const unavailable = items.find((i) => i.product.status !== "PUBLIE" || i.product.quantity < i.quantity);
  if (unavailable) {
    return { error: `« ${unavailable.product.title} » n'est plus disponible dans cette quantité.` };
  }

  const zone = await prisma.deliveryZone.findFirst({ where: { city, name: quartier, isActive: true } });
  const deliveryFee = items.every((i) => i.product.pickupOnly) ? 0 : zone?.fee ?? 3000;

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + deliveryFee;
  const reference = await nextOrderReference();

  // Ce qui relève d'une mise en relation est conservé par Le Beau Défaut jusqu'à la réception.
  // Ce qui vient de notre propre stock ne passe pas par le séquestre : l'argent est déjà à nous.
  const escrowAmount = items
    .filter((i) => i.product.saleMode === "PARTICULIER")
    .reduce((s, i) => s + i.product.price * i.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        reference,
        buyerId: user.id,
        status: "EN_ATTENTE_PAIEMENT",
        paymentMethod,
        paymentStatus: "EN_ATTENTE",
        subtotal,
        deliveryFee,
        total,
        escrowAmount,
        escrowStatus: escrowAmount > 0 ? "SOUS_SEQUESTRE" : "AUCUN",
        recipientName,
        recipientPhone,
        city,
        quartier,
        landmark: landmark || null,
        notes: notes || null,
        items: {
          create: items.map((i) => {
            const commissionPct = i.product.seller.seller?.commissionPct ?? DEFAULT_COMMISSION_PCT;
            const lineTotal = i.product.price * i.quantity;
            return {
              productId: i.productId,
              sellerId: i.product.sellerId,
              titleSnapshot: i.product.title,
              imageSnapshot: i.product.images[0]?.url ?? null,
              defectSnapshot: i.product.defectSummary,
              gradeSnapshot: i.product.defectGrade,
              unitPrice: i.product.price,
              quantity: i.quantity,
              lineTotal,
              commissionPct,
              sellerAmount: Math.round(lineTotal * (1 - commissionPct / 100)),
            };
          }),
        },
        events: {
          create: {
            status: "EN_ATTENTE_PAIEMENT",
            label: "Commande enregistrée",
            note: "Paiement : dépôt Mobile Money, en attente de la preuve",
            actorId: user.id,
          },
        },
        delivery: {
          create: {
            status: "A_ASSIGNER",
            trackingCode: `LBD${Date.now().toString(36).toUpperCase()}`,
            fee: deliveryFee,
          },
        },
      },
      include: { items: true },
    });

    // Décrément du stock, passage en VENDU si épuisé
    for (const i of items) {
      const remaining = i.product.quantity - i.quantity;
      await tx.product.update({
        where: { id: i.productId },
        data: {
          quantity: remaining,
          soldCount: { increment: i.quantity },
          ...(remaining <= 0 ? { status: "VENDU" } : {}),
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { userId: user.id } });

    // Notifications vendeurs
    const sellerIds = [...new Set(items.map((i) => i.product.sellerId))];
    await tx.notification.createMany({
      data: sellerIds.map((sellerId) => ({
        userId: sellerId,
        type: "COMMANDE",
        title: "Nouvelle commande",
        body: `Commande ${reference} — un de vos articles est réservé, en attente du paiement Mobile Money.`,
        link: "/vendeur/ventes",
      })),
    });

    await tx.notification.create({
      data: {
        userId: user.id,
        type: "COMMANDE",
        title: "Commande enregistrée",
        body: `Votre commande ${reference} est réservée. Déposez ${money(total)} par Mobile Money et envoyez-nous la preuve : nous confirmons dès réception.`,
        link: `/compte/commandes/${created.id}`,
      },
    });

    // L'équipe voit chaque nouvelle commande arriver.
    const admins = await tx.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    if (admins.length) {
      await tx.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: "COMMANDE",
          title: "Nouvelle commande",
          body: `${reference} · ${recipientName} · ${money(total)} — paiement Mobile Money attendu.`,
          link: `/admin/commandes/${created.id}`,
        })),
      });
    }

    return created;
  });

  revalidatePath("/", "layout");
  redirect(`/compte/commandes/${order.id}?nouveau=1`);
}

export async function cancelOrderAction(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") || "");
  const reason = String(formData.get("reason") || "Annulée par le client");

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    include: { items: true },
  });
  if (!order) return;
  if (!["EN_ATTENTE_PAIEMENT", "PAYEE", "CONFIRMEE"].includes(order.status)) return;

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "ANNULEE", cancelReason: reason },
    });
    await tx.orderEvent.create({
      data: { orderId: order.id, status: "ANNULEE", label: "Commande annulée", note: reason, actorId: user.id },
    });
    await tx.delivery.updateMany({ where: { orderId: order.id }, data: { status: "ECHEC", failureNote: reason } });

    // Remise en stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantity: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
          status: "PUBLIE",
        },
      });
    }
  });

  revalidatePath("/", "layout");
}

/* ---------------------------- Avis ---------------------------- */

export async function submitReviewAction(_prev: { error?: string; success?: string } | undefined, formData: FormData) {
  const user = await requireUser();
  const productId = String(formData.get("productId") || "");
  const rating = Number(formData.get("rating") || 0);
  const comment = String(formData.get("comment") || "").trim();
  const defectAsDescribed = formData.get("defectAsDescribed") === "on";

  if (rating < 1 || rating > 5) return { error: "Choisissez une note de 1 à 5." };

  const bought = await prisma.orderItem.findFirst({
    where: { productId, order: { buyerId: user.id, status: "LIVREE" } },
  });
  if (!bought) return { error: "Vous ne pouvez évaluer qu'un article que vous avez reçu." };

  await prisma.review.upsert({
    where: { productId_userId: { productId, userId: user.id } },
    create: { productId, userId: user.id, rating, comment: comment || null, defectAsDescribed },
    update: { rating, comment: comment || null, defectAsDescribed },
  });

  // Recalcul de la note du vendeur
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product) {
    const agg = await prisma.review.aggregate({
      where: { product: { sellerId: product.sellerId }, isPublished: true },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.sellerProfile.updateMany({
      where: { userId: product.sellerId },
      data: { rating: agg._avg.rating ?? 0, ratingCount: agg._count },
    });
  }

  revalidatePath("/", "layout");
  return { success: "Merci, votre avis est publié." };
}

/* ---------------------------- Messagerie ---------------------------- */

export async function sendMessageAction(formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  let threadId = String(formData.get("threadId") || "");
  const productId = String(formData.get("productId") || "");

  if (!threadId && productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return;

    const existing = await prisma.thread.findFirst({
      where: {
        productId,
        members: { some: { userId: user.id } },
        AND: { members: { some: { userId: product.sellerId } } },
      },
    });

    if (existing) {
      threadId = existing.id;
    } else {
      const thread = await prisma.thread.create({
        data: {
          productId,
          subject: product.title,
          members: { create: [{ userId: user.id }, { userId: product.sellerId }] },
        },
      });
      threadId = thread.id;
    }
  }
  if (!threadId) return;

  const member = await prisma.threadMember.findFirst({ where: { threadId, userId: user.id } });
  if (!member) return;

  // Les coordonnées ne sont masquées que sur les mises en relation entre particuliers :
  // quand l'équipe Le Beau Défaut écrit au sujet de son propre stock, elle peut donner son numéro.
  const fromTeam = user.role === "ADMIN" || user.seller?.isHouse === true;
  const safe = fromTeam ? { body, filtered: false } : sanitizeMessage(body);
  if (!safe.body) return;

  await prisma.message.create({
    data: { threadId, senderId: user.id, body: safe.body, wasFiltered: safe.filtered },
  });
  await prisma.thread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });

  const others = await prisma.threadMember.findMany({ where: { threadId, NOT: { userId: user.id } } });
  await prisma.notification.createMany({
    data: others.map((m) => ({
      userId: m.userId,
      type: "MESSAGE",
      title: `Message de ${user.firstName}`,
      body: safe.body.slice(0, 120),
      link: `/messages/${threadId}`,
    })),
  });

  revalidatePath("/", "layout");
  redirect(`/messages/${threadId}`);
}

/* ---------------------------- Notifications ---------------------------- */

export async function markNotificationsReadAction() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/", "layout");
}

/* ---------------------------- Séquestre ---------------------------- */

/**
 * L'acheteur confirme avoir reçu son article conforme : l'argent part au vendeur.
 * C'est le geste qui clôt une mise en relation.
 */
export async function confirmReceptionAction(formData: FormData) {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") || "");
  if (!orderId) return;

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    select: { id: true, status: true, escrowStatus: true },
  });
  if (!order || order.status !== "LIVREE" || order.escrowStatus !== "SOUS_SEQUESTRE") return;

  await prisma.$transaction(async (tx) => {
    await releaseEscrowForOrder(tx, orderId, "Réception confirmée par l'acheteur.", user.id);
  });

  revalidatePath("/", "layout");
}

/* ---------------------------- Preuve de paiement ---------------------------- */

/**
 * L'acheteur dépose la capture de son dépôt Mobile Money sur sa commande.
 * Rien n'est encaissé automatiquement : l'équipe regarde la preuve et confirme à la main.
 */
export async function declarePaymentAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") || "");
  const transaction = String(formData.get("transaction") || "").trim().slice(0, 80);

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: user.id },
    select: { id: true, reference: true, total: true, paymentStatus: true },
  });
  if (!order) return { error: "Commande introuvable." };
  if (order.paymentStatus === "PAYE") return { error: "Cette commande est déjà payée." };

  const proof = await saveImage(formData.get("proof") as File | null);
  if (!proof && !transaction) {
    return { error: "Joignez la capture de votre dépôt, ou au moins le numéro de transaction reçu par SMS." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentDeclaredAt: new Date(),
      paymentRejectReason: null,
      ...(proof ? { paymentProofUrl: proof } : {}),
      ...(transaction ? { paymentRef: transaction } : {}),
    },
  });
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      status: "EN_ATTENTE_PAIEMENT",
      label: "Preuve de paiement envoyée",
      note: transaction ? `Transaction ${transaction}` : "Capture du dépôt jointe",
      actorId: user.id,
    },
  });

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: "COMMANDE",
      title: "Paiement à vérifier",
      body: `Commande ${order.reference} : preuve de dépôt reçue.`,
      link: `/admin/commandes/${order.id}`,
    })),
  });

  revalidatePath("/", "layout");
  return { success: "Preuve envoyée. Nous vérifions le dépôt et confirmons votre commande au plus vite." };
}

/* ---------------------------- Service client & signalements ---------------------------- */

async function teamIds() {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  return admins.map((a) => a.id);
}

/**
 * Le client écrit à l'équipe (commande, paiement, livraison…).
 * La conversation est un fil de messages ordinaire, partagé avec tous les administrateurs.
 */
export async function contactSupportAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const user = await requireUser("/messages/nouveau");
  const topic = String(formData.get("topic") || "AUTRE");
  const orderRef = String(formData.get("orderRef") || "").trim().slice(0, 40);
  const body = String(formData.get("body") || "").trim().slice(0, 2000);
  if (body.length < 5) return { error: "Décrivez votre demande en quelques mots." };

  const topicLabel = SUPPORT_TOPICS.find((t) => t.key === topic)?.label ?? "Autre question";
  const subject = `${SUPPORT_PREFIX}${topicLabel}${orderRef ? ` · ${orderRef}` : ""}`;
  const admins = (await teamIds()).filter((id) => id !== user.id);

  const thread = await prisma.thread.create({
    data: {
      subject,
      members: { create: [{ userId: user.id, lastReadAt: new Date() }, ...admins.map((userId) => ({ userId }))] },
      messages: { create: { senderId: user.id, body } },
    },
  });

  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((userId) => ({
        userId,
        type: "MESSAGE",
        title: `Support : ${user.firstName} ${user.lastName}`,
        body: `${topicLabel}${orderRef ? ` (${orderRef})` : ""} — ${body.slice(0, 100)}`,
        link: `/admin/support/${thread.id}`,
      })),
    });
  }

  revalidatePath("/", "layout");
  redirect(`/messages/${thread.id}`);
}

/** Un visiteur connecté signale une annonce : l'équipe la voit dans « Signalements ». */
export async function reportProductAction(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const productId = String(formData.get("productId") || "");
  const user = await requireUser(`/messages/nouveau?signaler=${productId}`);
  const reason = String(formData.get("reason") || "AUTRE");
  const details = String(formData.get("details") || "").trim().slice(0, 2000);

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, title: true, reference: true } });
  if (!product) return { error: "Annonce introuvable." };

  const reasonLabel = REPORT_REASONS.find((r) => r.key === reason)?.label ?? "Autre";
  const admins = (await teamIds()).filter((id) => id !== user.id);

  const thread = await prisma.thread.create({
    data: {
      productId: product.id,
      subject: `${REPORT_PREFIX}${reasonLabel}`,
      members: { create: [{ userId: user.id, lastReadAt: new Date() }, ...admins.map((userId) => ({ userId }))] },
      messages: {
        create: {
          senderId: user.id,
          body: `Signalement de l'annonce ${product.reference} « ${product.title} » — ${reasonLabel}.${details ? `\n\n${details}` : ""}`,
        },
      },
    },
  });

  if (admins.length) {
    await prisma.notification.createMany({
      data: admins.map((userId) => ({
        userId,
        type: "SYSTEME",
        title: "Annonce signalée",
        body: `${product.reference} · ${reasonLabel} — par ${user.firstName} ${user.lastName}`,
        link: `/admin/support/${thread.id}`,
      })),
    });
  }

  revalidatePath("/", "layout");
  redirect(`/messages/${thread.id}`);
}
