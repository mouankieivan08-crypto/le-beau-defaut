import Link from "next/link";
import ResponsiveTable from "@/components/ResponsiveTable";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, relativeFR, phoneFR } from "@/lib/format";
import { DELIVERY_STATUS, VEHICLES, CITIES } from "@/lib/constants";
import { assignCourierAction, upsertZoneAction, deleteZoneAction } from "@/lib/actions/admin";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";
import { Badge, PageHeader, Card, Stat, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Livraisons" };

export default async function AdminDeliveriesPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin("/admin/livraisons");
  const { statut = "ACTIVES" } = await searchParams;

  const where =
    statut === "ACTIVES"
      ? { status: { in: ["A_ASSIGNER", "ASSIGNEE", "RECUPEREE", "EN_ROUTE"] }, order: { status: { notIn: ["ANNULEE", "EN_ATTENTE_PAIEMENT"] } } }
      : statut === "A_ASSIGNER"
        ? { status: "A_ASSIGNER", order: { status: { notIn: ["ANNULEE", "EN_ATTENTE_PAIEMENT"] } } }
        : { status: statut };

  const [deliveries, couriers, zones, stats] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        order: { select: { id: true, reference: true, recipientName: true, recipientPhone: true, city: true, quartier: true, total: true, items: { select: { titleSnapshot: true } } } },
        courier: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: "asc" },
      take: 60,
    }),
    prisma.courierProfile.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        _count: { select: { deliveries: { where: { status: { in: ["ASSIGNEE", "RECUPEREE", "EN_ROUTE"] } } } } },
      },
    }),
    prisma.deliveryZone.findMany({ orderBy: [{ city: "asc" }, { fee: "asc" }] }),
    prisma.delivery.groupBy({ by: ["status"], _count: true }),
  ]);
  const countBy = Object.fromEntries(stats.map((s) => [s.status, s._count])) as Record<string, number>;

  const TABS = [
    { key: "ACTIVES", label: "En cours" },
    { key: "A_ASSIGNER", label: "Sans livreur" },
    { key: "LIVREE", label: "Livrées" },
    { key: "ECHEC", label: "Échecs" },
  ];

  return (
    <>
      <PageHeader title="Livraisons" subtitle="Assignez les courses, suivez les livreurs et réglez les tarifs par quartier." />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <Stat label="Sans livreur" value={countBy.A_ASSIGNER ?? 0} icon="alert" tone={(countBy.A_ASSIGNER ?? 0) > 0 ? "danger" : "neutral"} />
        <Stat label="Assignées" value={countBy.ASSIGNEE ?? 0} icon="truck" tone="info" />
        <Stat label="En route" value={(countBy.RECUPEREE ?? 0) + (countBy.EN_ROUTE ?? 0)} icon="truck" />
        <Stat label="Livrées" value={countBy.LIVREE ?? 0} icon="check-circle" tone="success" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div>
          <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <Link
                key={t.key}
                href={`/admin/livraisons?statut=${t.key}`}
                className={`chip !text-xs !px-3 !py-1.5 ${
                  statut === t.key
                    ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                    : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)]"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {deliveries.length === 0 ? (
            <EmptyState icon="truck" title="Rien à afficher" message="Aucune livraison dans cet état." />
          ) : (
            <ResponsiveTable>
              <table className="table-lbd">
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Destination</th>
                    <th>Statut</th>
                    <th>Livreur</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => {
                    const local = couriers.filter((c) => c.zones.includes(d.order.city));
                    const others = couriers.filter((c) => !c.zones.includes(d.order.city));
                    return (
                      <tr key={d.id}>
                        <td className="min-w-[180px]">
                          <Link href={`/admin/commandes/${d.order.id}`} className="font-mono text-xs font-medium hover:text-[var(--color-gold-dark)]">
                            {d.order.reference}
                          </Link>
                          <p className="text-[11px] text-[var(--color-ink-muted)] line-clamp-1">
                            {d.order.items.map((i) => i.titleSnapshot).join(", ")}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-muted)]">créée {relativeFR(d.createdAt)}</p>
                        </td>
                        <td>
                          <p className="whitespace-nowrap">
                            {d.order.quartier}, {d.order.city}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-muted)]">
                            {d.order.recipientName} · {phoneFR(d.order.recipientPhone)}
                          </p>
                        </td>
                        <td>
                          <Badge tone={DELIVERY_STATUS[d.status].tone}>{DELIVERY_STATUS[d.status].label}</Badge>
                          <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">Frais {money(d.fee)}</p>
                        </td>
                        <td className="min-w-[240px]">
                          {d.status === "LIVREE" ? (
                            <span className="text-sm">
                              {d.courier ? `${d.courier.user.firstName} ${d.courier.user.lastName}` : "—"}
                            </span>
                          ) : (
                            <form action={assignCourierAction} className="flex gap-1.5">
                              <input type="hidden" name="deliveryId" value={d.id} />
                              <select name="courierId" defaultValue={d.courierId ?? ""} className="field !py-1.5 text-xs">
                                <option value="">— Choisir —</option>
                                {local.length > 0 && (
                                  <optgroup label={`Zone ${d.order.city}`}>
                                    {local.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.user.firstName} {c.user.lastName} · {VEHICLES[c.vehicle]?.label} · {c._count.deliveries} en cours
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {others.length > 0 && (
                                  <optgroup label="Autres zones">
                                    {others.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.user.firstName} {c.user.lastName} · {c.zones}
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>
                              <button className="btn btn-primary btn-sm !px-2.5" aria-label="Assigner">
                                <Icon name="check" size={13} />
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Livreurs</h2>
            <ul className="flex flex-col gap-3">
              {couriers.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      background:
                        c.status === "DISPONIBLE" ? "var(--color-success)" : c.status === "EN_COURSE" ? "var(--color-warning)" : "var(--color-sand)",
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {c.user.firstName} {c.user.lastName}
                    </p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {VEHICLES[c.vehicle]?.label} · {c.zones} ·{" "}
                      {c.status === "DISPONIBLE" ? "Disponible" : c.status === "EN_COURSE" ? "En course" : "Hors ligne"}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-ink-muted)] text-right">
                    <strong className="text-[var(--color-ink)]">{c._count.deliveries}</strong> en cours
                    <br />
                    {c.totalRuns} livrées
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/admin/utilisateurs?role=LIVREUR" className="btn btn-outline btn-sm w-full mt-4">
              <Icon name="plus" size={13} /> Ajouter un livreur
            </Link>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold mb-1">Tarifs par quartier</h2>
            <p className="text-xs text-[var(--color-ink-muted)] mb-3">Appliqués automatiquement au moment de la commande.</p>
            <div className="max-h-72 overflow-y-auto -mx-1 px-1">
              <table className="w-full text-sm">
                <tbody>
                  {zones.map((z) => (
                    <tr key={z.id} className="border-b border-[var(--color-sand)]/60 last:border-0">
                      <td className="py-1.5">
                        {z.name}
                        <span className="block text-[10px] text-[var(--color-ink-muted)]">
                          {z.city} · {z.etaHours} h
                        </span>
                      </td>
                      <td className="py-1.5 text-right whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {money(z.fee)}
                      </td>
                      <td className="py-1.5 text-right w-8">
                        <form action={deleteZoneAction}>
                          <input type="hidden" name="zoneId" value={z.id} />
                          <button className="text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] p-1" aria-label={`Supprimer ${z.name}`}>
                            <Icon name="trash" size={13} />
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ActionForm action={upsertZoneAction} submitLabel="Enregistrer la zone" className="mt-4 pt-4 border-t border-[var(--color-sand)]" resetOnSuccess submitClassName="btn btn-primary btn-sm w-full">
              <div className="grid grid-cols-2 gap-2">
                <select name="city" className="field" defaultValue="Brazzaville" aria-label="Ville">
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input name="name" className="field" placeholder="Quartier" required />
                <input name="fee" type="number" min={0} step={500} className="field" placeholder="Tarif FCFA" required />
                <input name="etaHours" type="number" min={1} className="field" placeholder="Délai (h)" defaultValue={48} />
              </div>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
