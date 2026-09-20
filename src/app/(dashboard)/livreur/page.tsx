import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { money, phoneFR, relativeFR, waLink } from "@/lib/format";
import { DELIVERY_STATUS, VEHICLES } from "@/lib/constants";
import { daysAgo } from "@/lib/stats";
import { updateDeliveryStatusAction, setCourierStatusAction, claimDeliveryAction } from "@/lib/actions/courier";
import Icon from "@/components/Icon";
import { Badge, Stat, EmptyState, Alert, PageHeader } from "@/components/ui";
import PhotoInput from "@/components/PhotoInput";

export const metadata: Metadata = { title: "Mes courses" };

const NEXT: Record<string, { status: string; label: string; icon: "package" | "truck" | "check" }> = {
  ASSIGNEE: { status: "RECUPEREE", label: "J'ai récupéré le colis", icon: "package" },
  RECUPEREE: { status: "EN_ROUTE", label: "Je pars livrer", icon: "truck" },
  EN_ROUTE: { status: "LIVREE", label: "Colis livré", icon: "check" },
};

export default async function CourierHome() {
  const user = await requireRole(["LIVREUR", "ADMIN"], "/livreur");
  const courier = user.courier;

  if (!courier) {
    return (
      <>
        <PageHeader title="Mes courses" />
        <EmptyState icon="truck" title="Aucun profil livreur associé à ce compte" />
      </>
    );
  }

  const zones = courier.zones.split(";").map((z) => z.trim());
  const today = daysAgo(0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [active, available, doneToday, doneMonth] = await Promise.all([
    prisma.delivery.findMany({
      where: { courierId: courier.id, status: { in: ["ASSIGNEE", "RECUPEREE", "EN_ROUTE"] } },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    weightKg: true,
                    city: true,
                    quartier: true,
                    seller: { select: { seller: { select: { shopName: true, contactPhone: true, address: true } } } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.delivery.findMany({
      where: {
        status: "A_ASSIGNER",
        courierId: null,
        order: { city: { in: zones }, status: { in: ["PAYEE", "CONFIRMEE", "EN_PREPARATION"] } },
      },
      include: { order: { select: { reference: true, quartier: true, city: true, items: { select: { titleSnapshot: true, quantity: true } } } } },
      orderBy: { createdAt: "asc" },
      take: 10,
    }),
    prisma.delivery.count({ where: { courierId: courier.id, status: "LIVREE", deliveredAt: { gte: today } } }),
    prisma.delivery.aggregate({
      where: { courierId: courier.id, status: "LIVREE", deliveredAt: { gte: monthStart } },
      _count: true,
      _sum: { fee: true },
    }),
  ]);

  const toCollect = active
    .filter((d) => d.order.paymentMethod === "ESPECES_LIVRAISON" && d.order.paymentStatus !== "PAYE")
    .reduce((s, d) => s + d.order.total, 0);

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h1 className="font-display text-[26px] font-bold leading-tight">Bonjour {user.firstName}</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {VEHICLES[courier.vehicle]?.label} {courier.plateNumber && `· ${courier.plateNumber}`} · {zones.join(", ")}
          </p>
        </div>
        <form action={setCourierStatusAction} className="flex rounded-full bg-[var(--color-linen)] border border-[var(--color-sand)] p-1">
          {(
            [
              ["DISPONIBLE", "Disponible"],
              ["HORS_LIGNE", "Hors ligne"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              name="status"
              value={key}
              aria-pressed={courier.status === key || (key === "DISPONIBLE" && courier.status === "EN_COURSE")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                courier.status === key || (key === "DISPONIBLE" && courier.status === "EN_COURSE")
                  ? key === "DISPONIBLE"
                    ? "bg-[var(--color-grade-a)] text-white"
                    : "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "text-[var(--color-ink-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="En cours" value={active.length} icon="truck" tone="info" />
        <Stat label="Livrées aujourd'hui" value={doneToday} icon="check-circle" tone="success" />
        <Stat label="Ce mois-ci" value={doneMonth._count} hint={`${money(doneMonth._sum.fee ?? 0)} de frais`} icon="chart" />
        <Stat label="Espèces à encaisser" value={money(toCollect, false)} hint="FCFA sur les courses en cours" icon="wallet" tone="gold" />
      </div>

      <h2 className="font-display text-xl font-bold mb-3">Courses en cours</h2>
      {active.length === 0 ? (
        <EmptyState icon="truck" title="Aucune course en cours" message="Prenez une course disponible ci-dessous ou attendez une assignation." />
      ) : (
        <ol className="flex flex-col gap-4 mb-8">
          {active.map((d, idx) => {
            const o = d.order;
            const next = NEXT[d.status];
            const cash = o.paymentMethod === "ESPECES_LIVRAISON" && o.paymentStatus !== "PAYE";
            const weight = o.items.reduce((s, i) => s + (i.product.weightKg ?? 0) * i.quantity, 0);
            const pickups = Array.from(
              new Map(
                o.items.map((i) => [
                  i.product.seller.seller?.shopName,
                  { shop: i.product.seller.seller?.shopName, phone: i.product.seller.seller?.contactPhone, address: i.product.seller.seller?.address },
                ])
              ).values()
            );
            return (
              <li key={d.id} className="surface overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[var(--color-ink)] text-[var(--color-cream)]">
                  <span className="text-xs font-semibold">
                    Course {idx + 1} · <span className="font-mono">{o.reference}</span>
                  </span>
                  <Badge tone={DELIVERY_STATUS[d.status].tone}>{DELIVERY_STATUS[d.status].label}</Badge>
                </div>

                <div className="p-4 flex flex-col gap-4">
                  {d.status === "ASSIGNEE" && (
                    <div>
                      <p className="label">1. Récupérer chez</p>
                      {pickups.map((p) => (
                        <div key={p.shop} className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{p.shop}</p>
                            <p className="text-xs text-[var(--color-ink-muted)]">{p.address}</p>
                          </div>
                          {p.phone && (
                            <a href={`tel:${p.phone}`} className="btn btn-outline btn-sm">
                              <Icon name="phone" size={13} /> Vendeur
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="label">{d.status === "ASSIGNEE" ? "2. Livrer à" : "Livrer à"}</p>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold">{o.recipientName}</p>
                        <p className="text-sm">
                          <Icon name="pin" size={13} className="inline -mt-0.5 text-[var(--color-gold)]" /> {o.quartier}, {o.city}
                        </p>
                        {o.landmark && <p className="text-sm text-[var(--color-ink-muted)] italic">{o.landmark}</p>}
                        {o.notes && <p className="text-xs mt-1 p-2 rounded-lg bg-[var(--color-cream-deep)]">« {o.notes} »</p>}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <a href={`tel:${o.recipientPhone}`} className="btn btn-primary" aria-label={`Appeler ${o.recipientName}`}>
                          <Icon name="phone" size={15} /> {phoneFR(o.recipientPhone)}
                        </a>
                        {waLink(o.recipientPhone, `Bonjour, je suis votre livreur Le Beau Défaut pour la commande ${o.reference}. Je passe dans peu de temps.`) && (
                          <a
                            href={
                              waLink(
                                o.recipientPhone,
                                `Bonjour, je suis votre livreur Le Beau Défaut pour la commande ${o.reference}. Je passe dans peu de temps.`
                              )!
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                          >
                            <Icon name="message" size={13} /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm border-t border-[var(--color-sand)] pt-3">
                    <p className="label">Colis</p>
                    <ul className="flex flex-col gap-0.5">
                      {o.items.map((i) => (
                        <li key={i.id}>
                          {i.quantity} × {i.titleSnapshot}
                        </li>
                      ))}
                    </ul>
                    {weight > 0 && <p className="text-xs text-[var(--color-ink-muted)] mt-1">≈ {Math.round(weight)} kg</p>}
                  </div>

                  {cash ? (
                    <Alert tone="warning" title={`À encaisser : ${money(o.total)}`}>
                      Paiement en espèces à la livraison. Remettez le montant au dépôt en fin de journée.
                    </Alert>
                  ) : (
                    <p className="text-xs text-[var(--color-success)] flex items-center gap-1.5">
                      <Icon name="check-circle" size={14} /> Déjà payé — rien à encaisser
                    </p>
                  )}

                  {next && (
                    <form action={updateDeliveryStatusAction} className="flex flex-col gap-2">
                      <input type="hidden" name="deliveryId" value={d.id} />
                      <input type="hidden" name="status" value={next.status} />
                      {next.status === "LIVREE" && (
                        <label className="text-xs text-[var(--color-ink-muted)] flex flex-col gap-1">
                          Photo de remise (facultatif)
                          <PhotoInput name="proof" type="file" accept="image/*" capture="environment" className="text-sm" />
                        </label>
                      )}
                      <button className="btn btn-gold btn-lg w-full">
                        <Icon name={next.icon} size={17} /> {next.label}
                      </button>
                    </form>
                  )}

                  <details className="text-sm">
                    <summary className="cursor-pointer text-[var(--color-danger)] text-xs w-fit">Signaler un problème</summary>
                    <form action={updateDeliveryStatusAction} className="flex flex-col gap-2 mt-2">
                      <input type="hidden" name="deliveryId" value={d.id} />
                      <input type="hidden" name="status" value="ECHEC" />
                      <select name="note" className="field" defaultValue="Client injoignable">
                        <option>Client injoignable</option>
                        <option>Client absent à l&apos;adresse</option>
                        <option>Adresse introuvable</option>
                        <option>Colis refusé par le client</option>
                        <option>Article non conforme au départ</option>
                        <option>Colis trop volumineux pour le véhicule</option>
                      </select>
                      <button className="btn btn-outline btn-sm !text-[var(--color-danger)]">Déclarer l&apos;échec</button>
                    </form>
                  </details>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <h2 className="font-display text-xl font-bold mb-1">Courses disponibles</h2>
      <p className="text-sm text-[var(--color-ink-muted)] mb-3">Dans vos zones, sans livreur assigné.</p>
      {courier.status === "HORS_LIGNE" ? (
        <Alert tone="info">Passez en « Disponible » pour voir et prendre des courses.</Alert>
      ) : available.length === 0 ? (
        <EmptyState icon="check-circle" title="Aucune course en attente" />
      ) : (
        <ul className="flex flex-col gap-3">
          {available.map((d) => (
            <li key={d.id} className="surface p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {d.order.quartier}, {d.order.city}
                </p>
                <p className="text-xs text-[var(--color-ink-muted)] line-clamp-1">
                  {d.order.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(" · ")}
                </p>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  <span className="font-mono">{d.order.reference}</span> · en attente {relativeFR(d.createdAt)} · frais {money(d.fee)}
                </p>
              </div>
              <form action={claimDeliveryAction}>
                <input type="hidden" name="deliveryId" value={d.id} />
                <button className="btn btn-primary btn-sm">
                  <Icon name="plus" size={13} /> Prendre
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
