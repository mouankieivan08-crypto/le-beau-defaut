"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { saveImage } from "@/lib/upload";

/** Transitions autorisées côté livreur. */
const NEXT: Record<string, string[]> = {
  ASSIGNEE: ["RECUPEREE", "ECHEC"],
  RECUPEREE: ["EN_ROUTE", "ECHEC"],
  EN_ROUTE: ["LIVREE", "ECHEC"],
};

const ORDER_MIRROR: Record<string, string> = {
  RECUPEREE: "EN_PREPARATION",
  EN_ROUTE: "EN_LIVRAISON",
  LIVREE: "LIVREE",
};

export async function updateDeliveryStatusAction(formData: FormData) {
  const user = await requireRole(["LIVREUR", "ADMIN"], "/livreur");
  const deliveryId = String(formData.get("deliveryId") || "");
  const status = String(formData.get("status") || "");
  const note = String(formData.get("note") || "").trim() || null;

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: { courier: true, order: { include: { items: true } } },
  });
  if (!delivery) return;

  if (user.role === "LIVREUR") {
    const profile = await prisma.courierProfile.findUnique({ where: { userId: user.id } });
    if (!profile || delivery.courierId !== profile.id) return;
    if (!NEXT[delivery.status]?.includes(status)) return;
  }

  const proof = await saveImage(formData.get("proof") as File | null);

  await prisma.$transaction(async (tx) => {
    await tx.delivery.update({
      where: { id: deliveryId },
      data: {
        status,
        ...(status === "RECUPEREE" ? { pickedUpAt: new Date() } : {}),
        ...(status === "LIVREE" ? { deliveredAt: new Date() } : {}),
        ...(status === "ECHEC" ? { failureNote: note ?? "Livraison impossible" } : {}),
        ...(proof ? { proofUrl: proof } : {}),
      },
    });

    const orderStatus = ORDER_MIRROR[status];
    if (orderStatus) {
      await tx.order.update({
        where: { id: delivery.orderId },
        data: {
          status: orderStatus,
          ...(status === "LIVREE" ? { deliveredAt: new Date(), paymentStatus: "PAYE" } : {}),
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: delivery.orderId,
          status: orderStatus,
          label: `Livraison : ${status.replace(/_/g, " ").toLowerCase()}`,
          note,
          actorId: user.id,
        },
      });
    }

    if (status === "LIVREE") {
      if (delivery.courierId) {
        await tx.courierProfile.update({
          where: { id: delivery.courierId },
          data: { totalRuns: { increment: 1 }, status: "DISPONIBLE" },
        });
      }
      // Versements vendeurs exigibles
      const bySeller = new Map<string, number>();
      for (const item of delivery.order.items) {
        bySeller.set(item.sellerId, (bySeller.get(item.sellerId) ?? 0) + item.sellerAmount);
      }
      for (const [sellerUserId, amount] of bySeller) {
        const profile = await tx.sellerProfile.findUnique({ where: { userId: sellerUserId } });
        if (!profile) continue;
        if (await tx.payout.findFirst({ where: { orderId: delivery.orderId, sellerId: profile.id } })) continue;
        const gross = delivery.order.items
          .filter((i) => i.sellerId === sellerUserId)
          .reduce((s, i) => s + i.lineTotal, 0);
        await tx.payout.create({
          data: { sellerId: profile.id, orderId: delivery.orderId, amount, commission: gross - amount },
        });
        await tx.sellerProfile.update({ where: { id: profile.id }, data: { totalSales: { increment: gross } } });
      }
    }

    if (status === "ECHEC" && delivery.courierId) {
      await tx.courierProfile.update({ where: { id: delivery.courierId }, data: { status: "DISPONIBLE" } });
    }
    if (status === "EN_ROUTE" && delivery.courierId) {
      await tx.courierProfile.update({ where: { id: delivery.courierId }, data: { status: "EN_COURSE" } });
    }

    await tx.notification.create({
      data: {
        userId: delivery.order.buyerId,
        type: "COMMANDE",
        title: `Commande ${delivery.order.reference}`,
        body:
          status === "LIVREE"
            ? "Votre commande a été livrée. Bonne installation !"
            : status === "ECHEC"
              ? `Livraison impossible : ${note ?? "à replanifier"}.`
              : `Livraison : ${status.replace(/_/g, " ").toLowerCase()}.`,
        link: `/compte/commandes/${delivery.orderId}`,
      },
    });
  });

  revalidatePath("/", "layout");
}

export async function setCourierStatusAction(formData: FormData) {
  const user = await requireRole(["LIVREUR", "ADMIN"]);
  const status = String(formData.get("status") || "DISPONIBLE");
  if (!["DISPONIBLE", "EN_COURSE", "HORS_LIGNE"].includes(status)) return;
  await prisma.courierProfile.updateMany({ where: { userId: user.id }, data: { status } });
  revalidatePath("/", "layout");
}

export async function updateCourierProfileAction(
  _prev: { error?: string; success?: string } | undefined,
  formData: FormData
) {
  const user = await requireRole(["LIVREUR", "ADMIN"], "/livreur/profil");
  const vehicle = String(formData.get("vehicle") || "MOTO");
  const plateNumber = String(formData.get("plateNumber") || "").trim() || null;
  const chosen = formData.getAll("zoneChoice").map(String).filter(Boolean);
  const zones = (chosen.length ? chosen.join(";") : String(formData.get("zones") || "").trim()) || "Brazzaville";
  const capacityKg = Math.max(1, Number(formData.get("capacityKg") || 50));

  await prisma.courierProfile.updateMany({
    where: { userId: user.id },
    data: { vehicle, plateNumber, zones, capacityKg },
  });
  revalidatePath("/", "layout");
  return { success: "Profil livreur mis à jour." };
}

/** Un livreur disponible peut prendre une course non assignée dans sa zone. */
export async function claimDeliveryAction(formData: FormData) {
  const user = await requireRole(["LIVREUR"], "/livreur");
  const deliveryId = String(formData.get("deliveryId") || "");

  const profile = await prisma.courierProfile.findUnique({ where: { userId: user.id } });
  if (!profile || profile.status === "HORS_LIGNE") return;

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery || delivery.courierId || delivery.status !== "A_ASSIGNER") return;

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { courierId: profile.id, status: "ASSIGNEE" },
  });
  revalidatePath("/", "layout");
}
