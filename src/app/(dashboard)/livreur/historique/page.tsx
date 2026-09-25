import type { Metadata } from "next";
import ResponsiveTable from "@/components/ResponsiveTable";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { money, dateTimeFR } from "@/lib/format";
import { DELIVERY_STATUS } from "@/lib/constants";
import { weeklySeries, daysAgo } from "@/lib/stats";
import { ColumnChart } from "@/components/Charts";
import { PageHeader, Badge, Stat, Card, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Historique & gains" };

export default async function CourierHistoryPage() {
  const user = await requireRole(["LIVREUR", "ADMIN"], "/livreur/historique");
  const courier = user.courier;
  if (!courier) {
    return (
      <>
        <PageHeader title="Historique" />
        <EmptyState icon="truck" title="Aucun profil livreur" />
      </>
    );
  }

  const [history, done84, totals] = await Promise.all([
    prisma.delivery.findMany({
      where: { courierId: courier.id, status: { in: ["LIVREE", "ECHEC"] } },
      include: { order: { select: { reference: true, quartier: true, city: true, total: true, paymentMethod: true } } },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
    prisma.delivery.findMany({
      where: { courierId: courier.id, status: "LIVREE", deliveredAt: { gte: daysAgo(84) } },
      select: { deliveredAt: true },
    }),
    prisma.delivery.groupBy({ by: ["status"], where: { courierId: courier.id }, _count: true, _sum: { fee: true } }),
  ]);

  const delivered = totals.find((t) => t.status === "LIVREE");
  const failed = totals.find((t) => t.status === "ECHEC");
  const successRate = delivered || failed
    ? Math.round(((delivered?._count ?? 0) / ((delivered?._count ?? 0) + (failed?._count ?? 0))) * 100)
    : 100;
  const weekly = weeklySeries(done84.map((d) => ({ date: d.deliveredAt!, amount: 1 })), 12).map((w) => ({
    ...w,
    detail: w.detail?.replace(/commande/g, "course"),
  }));

  return (
    <div className="max-w-4xl">
      <PageHeader title="Historique & gains" subtitle="Vos courses terminées et votre régularité." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Courses livrées" value={delivered?._count ?? 0} icon="check-circle" tone="success" />
        <Stat label="Taux de réussite" value={`${successRate} %`} icon="chart" hint={`${failed?._count ?? 0} échec(s)`} />
        <Stat label="Frais de livraison" value={money(delivered?._sum.fee ?? 0, false)} hint="FCFA, courses livrées" icon="wallet" tone="gold" />
        <Stat label="Note" value={courier.ratingCount ? courier.rating.toFixed(1).replace(".", ",") : "—"} icon="star" />
      </div>

      <Card className="mb-6">
        <h2 className="font-display text-lg font-bold">Courses livrées par semaine</h2>
        <p className="text-xs text-[var(--color-ink-muted)] mb-4">12 dernières semaines</p>
        <ColumnChart data={weekly} unit="count" caption="Nombre de courses livrées par semaine" height={200} />
      </Card>

      {history.length === 0 ? (
        <EmptyState icon="list" title="Pas encore de course terminée" />
      ) : (
        <ResponsiveTable>
          <table className="table-lbd">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Destination</th>
                <th>Terminée le</th>
                <th>Résultat</th>
                <th className="!text-right">Frais</th>
              </tr>
            </thead>
            <tbody>
              {history.map((d) => (
                <tr key={d.id}>
                  <td className="font-mono text-xs">{d.order.reference}</td>
                  <td>
                    {d.order.quartier}, {d.order.city}
                  </td>
                  <td className="text-sm whitespace-nowrap">{dateTimeFR(d.deliveredAt ?? d.updatedAt)}</td>
                  <td>
                    <Badge tone={DELIVERY_STATUS[d.status].tone}>{DELIVERY_STATUS[d.status].label}</Badge>
                    {d.failureNote && <p className="text-[11px] text-[var(--color-ink-muted)]">{d.failureNote}</p>}
                  </td>
                  <td className="text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(d.fee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
