import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { paymentMethodLabel } from "@/lib/constants";

/**
 * Export comptable au format CSV (séparateur point-virgule + BOM : Excel français
 * l'ouvre directement, accents compris).
 */
const sep = ";";

function toCsv(rows: (string | number | null | undefined)[][]) {
  const escape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(escape).join(sep)).join("\r\n");
}

const day = (d: Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return new Response("Accès refusé", { status: 403 });

  const { type } = await params;
  const today = new Date().toISOString().slice(0, 10);
  let csv = "";
  let name = "";

  if (type === "commandes") {
    const orders = await prisma.order.findMany({
      include: { buyer: { select: { email: true } }, items: true },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv([
      ["Référence", "Date", "Client", "E-mail", "Ville", "Quartier", "Statut", "Paiement", "Règlement", "Articles", "Sous-total", "Livraison", "Total", "Commission LBD"],
      ...orders.map((o) => [
        o.reference,
        day(o.createdAt),
        o.recipientName,
        o.buyer.email,
        o.city,
        o.quartier,
        o.status,
        paymentMethodLabel(o.paymentMethod),
        o.paymentStatus,
        o.items.reduce((s, i) => s + i.quantity, 0),
        o.subtotal,
        o.deliveryFee,
        o.total,
        o.items.reduce((s, i) => s + (i.lineTotal - i.sellerAmount), 0),
      ]),
    ]);
    name = `commandes-${today}.csv`;
  } else if (type === "versements") {
    const payouts = await prisma.payout.findMany({
      include: { seller: { select: { shopName: true, mobileMoney: true, mobileMoneyOp: true } }, order: { select: { reference: true } } },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv([
      ["Boutique", "Commande", "Créé le", "Statut", "Opérateur", "Numéro", "Commission", "Montant net", "Payé le", "Référence transfert"],
      ...payouts.map((p) => [
        p.seller.shopName,
        p.order?.reference,
        day(p.createdAt),
        p.status,
        p.seller.mobileMoneyOp,
        p.seller.mobileMoney,
        p.commission,
        p.amount,
        day(p.paidAt),
        p.reference,
      ]),
    ]);
    name = `versements-${today}.csv`;
  } else if (type === "annonces") {
    const products = await prisma.product.findMany({
      include: { category: { select: { name: true } }, seller: { select: { seller: { select: { shopName: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv([
      ["Référence", "Titre", "Boutique", "Univers", "Catégorie", "Grade", "Défaut", "Prix neuf", "Prix LBD", "Remise %", "Stock", "Vendus", "Vues", "Statut", "Publiée le"],
      ...products.map((p) => [
        p.reference,
        p.title,
        p.seller.seller?.shopName,
        p.vertical,
        p.category.name,
        p.defectGrade,
        p.defectSummary,
        p.priceOriginal,
        p.price,
        p.discountPct,
        p.quantity,
        p.soldCount,
        p.views,
        p.status,
        day(p.publishedAt),
      ]),
    ]);
    name = `annonces-${today}.csv`;
  } else {
    return new Response("Export inconnu", { status: 404 });
  }

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
