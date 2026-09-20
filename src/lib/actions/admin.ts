"use server";

import { revalidatePath } from "next/cache";
import { createPayoutsForOrder, releaseEscrowForOrder, refundEscrowForOrder } from "@/lib/escrow";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireRole, hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { ESCROW_RELEASE_DAYS } from "@/lib/constants";

type State = { error?: string; success?: string } | undefined;

async function log(actorId: string, action: string, entity: string, entityId?: string, details?: string) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId, details } });
}

/* ---------------------- Modération des annonces ---------------------- */

export async function approveProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("productId") || "");
  const featured = formData.get("featured") === "on";

  const product = await prisma.product.update({
    where: { id },
    data: {
      status: "PUBLIE",
      publishedAt: new Date(),
      moderatorId: admin.id,
      moderatedAt: new Date(),
      rejectionReason: null,
      ...(featured ? { isFeatured: true } : {}),
    },
  });

  await prisma.notification.create({
    data: {
      userId: product.sellerId,
      type: "ANNONCE",
      title: "Annonce publiée",
      body: `« ${product.title} » est en ligne.`,
      link: `/produit/${product.slug}`,
    },
  });
  await log(admin.id, "APPROUVER_ANNONCE", "Product", id, product.reference);

  revalidatePath("/", "layout");
}

export async function rejectProductAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("productId") || "");
  const typed = String(formData.get("reason") || "").trim();
  const template = String(formData.get("template") || "").trim();
  const reason = [template, typed].filter(Boolean).join(" ") || "Non conforme à la charte du défaut.";

  const product = await prisma.product.update({
    where: { id },
    data: { status: "REJETE", rejectionReason: reason, moderatorId: admin.id, moderatedAt: new Date() },
  });

  await prisma.notification.create({
    data: {
      userId: product.sellerId,
      type: "ANNONCE",
      title: "Annonce à corriger",
      body: `« ${product.title} » : ${reason}`,
      link: `/vendeur/annonces/${product.id}`,
    },
  });
  await log(admin.id, "REJETER_ANNONCE", "Product", id, reason);

  revalidatePath("/", "layout");
}

export async function toggleProductFlagAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("productId") || "");
  const flag = String(formData.get("flag") || "");
  if (!["isFeatured", "isFlashDeal"].includes(flag)) return;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data: { [flag]: !product[flag as "isFeatured" | "isFlashDeal"] },
  });
  await log(admin.id, "BASCULER_" + flag, "Product", id);
  revalidatePath("/", "layout");
}

export async function setAuthenticityAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("productId") || "");
  const authenticity = String(formData.get("authenticity") || "NON_VERIFIE");

  const product = await prisma.product.update({ where: { id }, data: { authenticity } });
  await prisma.notification.create({
    data: {
      userId: product.sellerId,
      type: "ANNONCE",
      title: "Authentification mise à jour",
      body: `« ${product.title} » : ${authenticity.replace(/_/g, " ").toLowerCase()}.`,
      link: `/produit/${product.slug}`,
    },
  });
  await log(admin.id, "AUTHENTICITE", "Product", id, authenticity);
  revalidatePath("/", "layout");
}

/* ---------------------- Utilisateurs & vendeurs ---------------------- */

export async function setSellerStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const sellerId = String(formData.get("sellerId") || "");
  const status = String(formData.get("status") || "");
  if (!["EN_ATTENTE", "ACTIF", "SUSPENDU"].includes(status)) return;

  const seller = await prisma.sellerProfile.update({ where: { id: sellerId }, data: { status } });

  const labels: Record<string, string> = {
    ACTIF: "Votre boutique est activée. Vous pouvez publier vos annonces.",
    SUSPENDU: "Votre boutique a été suspendue. Contactez l'administration.",
    EN_ATTENTE: "Votre boutique est repassée en attente de validation.",
  };
  await prisma.notification.create({
    data: { userId: seller.userId, type: "SYSTEME", title: "Statut de la boutique", body: labels[status], link: "/vendeur" },
  });

  // Une boutique suspendue voit ses annonces retirées de la vitrine.
  if (status === "SUSPENDU") {
    await prisma.product.updateMany({
      where: { sellerId: seller.userId, status: "PUBLIE" },
      data: { status: "ARCHIVE" },
    });
  }

  await log(admin.id, "STATUT_VENDEUR", "SellerProfile", sellerId, status);
  revalidatePath("/", "layout");
}

export async function setSellerCommissionAction(formData: FormData) {
  const admin = await requireAdmin();
  const sellerId = String(formData.get("sellerId") || "");
  const pct = Math.min(50, Math.max(0, Number(formData.get("commissionPct") || 15)));
  await prisma.sellerProfile.update({ where: { id: sellerId }, data: { commissionPct: pct } });
  await log(admin.id, "COMMISSION", "SellerProfile", sellerId, `${pct}%`);
  revalidatePath("/", "layout");
}

export async function toggleUserActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (userId === admin.id) return; // on ne se désactive pas soi-même

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  await log(admin.id, user.isActive ? "DESACTIVER_USER" : "ACTIVER_USER", "User", userId);
  revalidatePath("/", "layout");
}

export async function setUserRoleAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "");
  if (!["CLIENT", "VENDEUR", "LIVREUR", "ADMIN"].includes(role)) return;
  if (userId === admin.id) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { seller: true, courier: true } });
  if (!user) return;

  await prisma.user.update({ where: { id: userId }, data: { role } });

  // Créer le profil manquant selon le rôle
  if (role === "VENDEUR" && !user.seller) {
    let slug = slugify(`${user.firstName}-${user.lastName}`);
    if (await prisma.sellerProfile.findUnique({ where: { shopSlug: slug } })) slug += `-${userId.slice(-4)}`;
    await prisma.sellerProfile.create({
      data: {
        userId,
        shopName: `${user.firstName} ${user.lastName}`,
        shopSlug: slug,
        contactPhone: user.phone,
        city: user.city ?? "Brazzaville",
        status: "ACTIF",
      },
    });
  }
  if (role === "LIVREUR" && !user.courier) {
    await prisma.courierProfile.create({ data: { userId, zones: user.city ?? "Brazzaville" } });
  }

  await log(admin.id, "ROLE", "User", userId, role);
  revalidatePath("/", "layout");
}

export async function createUserAction(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "CLIENT");
  const password = String(formData.get("password") || "");

  if (!email.includes("@")) return { error: "Adresse e-mail invalide." };
  if (firstName.length < 2 || lastName.length < 2) return { error: "Nom et prénom requis." };
  if (password.length < 8) return { error: "Le mot de passe doit faire 8 caractères minimum." };
  if (await prisma.user.findUnique({ where: { email } })) return { error: "Cet e-mail est déjà utilisé." };

  const user = await prisma.user.create({
    data: { email, firstName, lastName, phone: phone || null, role, passwordHash: await hashPassword(password), isVerified: true },
  });

  if (role === "VENDEUR") {
    let slug = slugify(`${firstName}-${lastName}`);
    if (await prisma.sellerProfile.findUnique({ where: { shopSlug: slug } })) slug += `-${user.id.slice(-4)}`;
    await prisma.sellerProfile.create({
      data: { userId: user.id, shopName: `${firstName} ${lastName}`, shopSlug: slug, contactPhone: phone || null, status: "ACTIF" },
    });
  }
  if (role === "LIVREUR") {
    await prisma.courierProfile.create({ data: { userId: user.id } });
  }

  await log(admin.id, "CREER_USER", "User", user.id, role);
  revalidatePath("/", "layout");
  return { success: `Compte ${role.toLowerCase()} créé pour ${firstName} ${lastName}.` };
}

/* ---------------------- Commandes & livraisons ---------------------- */

export async function setOrderStatusAction(formData: FormData) {
  const actor = await requireRole(["ADMIN", "VENDEUR"]);
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim() || null;

  const allowed = ["PAYEE", "CONFIRMEE", "EN_PREPARATION", "EN_LIVRAISON", "LIVREE", "ANNULEE", "REMBOURSEE"];
  if (!allowed.includes(status)) return;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;

  // Un vendeur ne pilote que les commandes qui contiennent ses articles,
  // et ne peut ni rembourser ni marquer livré (c'est le rôle du livreur / de l'admin).
  if (actor.role === "VENDEUR") {
    if (!order.items.some((i) => i.sellerId === actor.id)) return;
    if (!["CONFIRMEE", "EN_PREPARATION", "ANNULEE"].includes(status)) return;
  }
  if (["ANNULEE", "REMBOURSEE"].includes(order.status)) return;

  await prisma.$transaction(async (tx) => {
    // Annulation avant livraison : remise en stock et livraison close.
    if (status === "ANNULEE" || (status === "REMBOURSEE" && order.status !== "LIVREE")) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity }, soldCount: { decrement: item.quantity }, status: "PUBLIE" },
        });
      }
      await tx.delivery.updateMany({
        where: { orderId },
        data: { status: "ECHEC", failureNote: note ?? "Commande annulée" },
      });
      await tx.order.update({ where: { id: orderId }, data: { cancelReason: note ?? "Annulée par l'équipe Le Beau Défaut" } });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "PAYEE" ? { paymentStatus: "PAYE", paidAt: new Date() } : {}),
        ...(status === "LIVREE" ? { deliveredAt: new Date(), paymentStatus: "PAYE" } : {}),
        ...(status === "REMBOURSEE" ? { paymentStatus: "REMBOURSE" } : {}),
      },
    });
    await tx.orderEvent.create({
      data: { orderId, status, label: `Statut : ${status.replace(/_/g, " ").toLowerCase()}`, note, actorId: actor.id },
    });

    // À la livraison, les versements vendeurs deviennent exigibles.
    if (status === "LIVREE") {
      await createPayoutsForOrder(tx, { id: orderId, items: order.items });
      await tx.delivery.updateMany({ where: { orderId }, data: { status: "LIVREE", deliveredAt: new Date() } });
    }

    await tx.notification.create({
      data: {
        userId: order.buyerId,
        type: "COMMANDE",
        title: `Commande ${order.reference}`,
        body: `Nouveau statut : ${status.replace(/_/g, " ").toLowerCase()}.`,
        link: `/compte/commandes/${orderId}`,
      },
    });
  });

  revalidatePath("/", "layout");
}

export async function assignCourierAction(formData: FormData) {
  const admin = await requireAdmin();
  const deliveryId = String(formData.get("deliveryId") || "");
  const courierId = String(formData.get("courierId") || "");

  const delivery = await prisma.delivery.update({
    where: { id: deliveryId },
    data: { courierId: courierId || null, status: courierId ? "ASSIGNEE" : "A_ASSIGNER" },
    include: { order: true },
  });

  if (courierId) {
    const courier = await prisma.courierProfile.findUnique({ where: { id: courierId } });
    if (courier) {
      await prisma.notification.create({
        data: {
          userId: courier.userId,
          type: "COMMANDE",
          title: "Nouvelle course",
          body: `Commande ${delivery.order.reference} vers ${delivery.order.quartier}, ${delivery.order.city}.`,
          link: "/livreur",
        },
      });
    }
  }

  await log(admin.id, "ASSIGNER_LIVREUR", "Delivery", deliveryId, courierId);
  revalidatePath("/", "layout");
}

/* ---------------------- Versements ---------------------- */

export async function markPayoutPaidAction(formData: FormData) {
  const admin = await requireAdmin();
  const payoutId = String(formData.get("payoutId") || "");
  const reference = String(formData.get("reference") || "").trim() || null;

  const payout = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "PAYE", paidAt: new Date(), reference },
    include: { seller: true },
  });

  await prisma.notification.create({
    data: {
      userId: payout.seller.userId,
      type: "PAIEMENT",
      title: "Versement effectué",
      body: `Un versement de ${payout.amount} FCFA a été envoyé.`,
      link: "/vendeur/paiements",
    },
  });

  await log(admin.id, "VERSEMENT_PAYE", "Payout", payoutId);
  revalidatePath("/", "layout");
}

/* ---------------------- Catalogue ---------------------- */

export async function createCategoryAction(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const vertical = String(formData.get("vertical") || "MOBILIER");
  const parentId = String(formData.get("parentId") || "") || null;

  if (name.length < 2) return { error: "Nom de catégorie trop court." };

  let slug = slugify(name);
  if (await prisma.category.findUnique({ where: { slug } })) slug = `${slug}-${vertical.toLowerCase()}`;
  if (await prisma.category.findUnique({ where: { slug } })) return { error: "Cette catégorie existe déjà." };

  await prisma.category.create({ data: { name, slug, vertical, parentId } });
  await log(admin.id, "CREER_CATEGORIE", "Category", slug);
  revalidatePath("/", "layout");
  return { success: `Catégorie « ${name} » créée.` };
}

export async function toggleCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("categoryId") || "");
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) return;
  await prisma.category.update({ where: { id }, data: { isActive: !cat.isActive } });
  revalidatePath("/", "layout");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("categoryId") || "");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.category.deleteMany({ where: { id } });
  }
  revalidatePath("/", "layout");
}

/* ---------------------- Zones & réglages ---------------------- */

export async function upsertZoneAction(_prev: State, formData: FormData): Promise<State> {
  await requireAdmin();
  const city = String(formData.get("city") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const fee = Number(formData.get("fee") || 0);
  const etaHours = Number(formData.get("etaHours") || 48);

  if (!city || !name) return { error: "Ville et quartier requis." };
  if (fee < 0) return { error: "Tarif invalide." };

  await prisma.deliveryZone.upsert({
    where: { city_name: { city, name } },
    create: { city, name, fee, etaHours },
    update: { fee, etaHours, isActive: true },
  });
  revalidatePath("/", "layout");
  return { success: `Zone ${name} (${city}) enregistrée à ${fee} FCFA.` };
}

export async function deleteZoneAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("zoneId") || "");
  await prisma.deliveryZone.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
}

export async function saveSettingsAction(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();
  const entries: [string, string][] = [];
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("setting:")) entries.push([key.slice(8), String(value)]);
  }
  for (const [key, value] of entries) {
    await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  await log(admin.id, "REGLAGES", "Setting", undefined, `${entries.length} clés`);
  revalidatePath("/", "layout");
  return { success: "Réglages enregistrés." };
}

/* ---------------------- Dépannage des comptes ---------------------- */

/**
 * Réinitialise le mot de passe d'un compte et renvoie le code provisoire.
 * Utile quand un vendeur ou un livreur ne peut plus se connecter : l'équipe le lui
 * dicte au téléphone, il le change ensuite depuis son profil.
 */
export async function resetUserPasswordAction(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (userId === admin.id) return { error: "Changez votre propre mot de passe depuis votre profil." };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Compte introuvable." };

  const temp = `LBD${Math.floor(1000 + Math.random() * 9000)}${String.fromCharCode(97 + Math.floor(Math.random() * 26))}!`;
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(temp) } });
  await prisma.notification.create({
    data: {
      userId,
      type: "SYSTEME",
      title: "Mot de passe réinitialisé",
      body: "Votre mot de passe a été réinitialisé par l'équipe. Changez-le depuis votre profil.",
      link: "/compte/profil",
    },
  });
  await log(admin.id, "REINIT_MOT_DE_PASSE", "User", userId, user.email);

  revalidatePath("/", "layout");
  return { success: `Mot de passe provisoire de ${user.firstName} ${user.lastName} : ${temp}` };
}

/* ---------------------------- Séquestre ---------------------------- */

/** Libère à la main l'argent retenu sur une commande (litige tranché, accord amiable…). */
export async function releaseEscrowAction(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const reason = String(formData.get("reason") || "").trim() || "Libéré par l'équipe Le Beau Défaut.";
  if (!orderId) return;

  await prisma.$transaction(async (tx) => {
    await releaseEscrowForOrder(tx, orderId, reason, admin.id);
  });
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "SEQUESTRE_LIBERE", entity: "Order", entityId: orderId, details: reason },
  });
  revalidatePath("/", "layout");
}

/** Libère d'un coup tout ce qui a dépassé le délai de réclamation. */
export async function releaseDueEscrowsAction() {
  const admin = await requireAdmin();
  const limit = new Date();
  limit.setDate(limit.getDate() - ESCROW_RELEASE_DAYS);

  const due = await prisma.order.findMany({
    where: {
      escrowStatus: "SOUS_SEQUESTRE",
      status: "LIVREE",
      deliveredAt: { lte: limit },
      claims: { none: { status: { in: ["OUVERTE", "EN_EXAMEN"] } } },
    },
    select: { id: true },
  });

  for (const order of due) {
    await prisma.$transaction(async (tx) => {
      await releaseEscrowForOrder(tx, order.id, `Délai de ${ESCROW_RELEASE_DAYS} jours écoulé sans réclamation.`, admin.id);
    });
  }
  revalidatePath("/", "layout");
}
