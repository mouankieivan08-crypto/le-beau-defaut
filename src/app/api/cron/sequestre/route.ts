import { prisma } from "@/lib/prisma";
import { releaseEscrowForOrder } from "@/lib/escrow";
import { ESCROW_RELEASE_DAYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Libération automatique du séquestre, une fois par jour (voir vercel.json).
 *
 * Un vendeur ne doit pas attendre qu'un acheteur pense à cliquer : passé le délai de
 * réclamation, et si rien n'a été signalé, l'argent part de lui-même.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const limit = new Date();
  limit.setDate(limit.getDate() - ESCROW_RELEASE_DAYS);

  const due = await prisma.order.findMany({
    where: {
      escrowStatus: "SOUS_SEQUESTRE",
      status: "LIVREE",
      deliveredAt: { lte: limit },
      claims: { none: { status: { in: ["OUVERTE", "EN_EXAMEN"] } } },
    },
    select: { id: true, reference: true },
  });

  const released: string[] = [];
  for (const order of due) {
    await prisma.$transaction(async (tx) => {
      const ok = await releaseEscrowForOrder(
        tx,
        order.id,
        `Délai de ${ESCROW_RELEASE_DAYS} jours écoulé sans réclamation.`
      );
      if (ok) released.push(order.reference);
    });
  }

  return Response.json({ examinees: due.length, liberees: released.length, references: released });
}
