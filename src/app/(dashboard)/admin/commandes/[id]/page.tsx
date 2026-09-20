import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateTimeFR, phoneFR } from "@/lib/format";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  paymentMethodLabel,
  VEHICLES,
} from "@/lib/constants";
import { setOrderStatusAction, assignCourierAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, Card, Steps } from "@/components/ui";

const NEXT_STEPS: Record<string, { status: string; label: string }[]> = {
  EN_ATTENTE_PAIEMENT: [
    { status: "PAYEE", label: "Paiement reçu" },
    { status: "ANNULEE", label: "Annuler" },
  ],
  PAYEE: [
    { status: "CONFIRMEE", label: "Confirmer la disponibilité" },
    { status: "REMBOURSEE", label: "Rembourser" },
  ],
  CONFIRMEE: [
    { status: "EN_PREPARATION", label: "Colis préparé / récupéré" },
    { status: "ANNULEE", label: "Annuler" },
  ],
  EN_PREPARATION: [{ status: "EN_LIVRAISON", label: "Remis au livreur" }],
  EN_LIVRAISON: [{ status: "LIVREE", label: "Marquer livrée" }],
  LIVREE: [{ status: "REMBOURSEE", label: "Rembourser (litige)" }],
};

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [order, couriers] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        buyer: true,
        items: { include: { product: { select: { slug: true, seller: { select: { seller: { select: { shopName: true, contactPhone: true } } } } } } } },
        events: { orderBy: { createdAt: "desc" } },
        delivery: { include: { courier: { include: { user: true } } } },
        payouts: { include: { seller: true } },
      },
    }),
    prisma.courierProfile.findMany({ include: { user: true }, orderBy: { status: "asc" } }),
  ]);
  if (!order) notFound();

  const st = ORDER_STATUS[order.status];
  const commission = order.items.reduce((s, i) => s + (i.lineTotal - i.sellerAmount), 0);
  const next = NEXT_STEPS[order.status] ?? [];

  return (
    <>
      <Link href="/admin/commandes" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Commandes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="text-xs text-[var(--color-ink-muted)]">{dateTimeFR(order.createdAt)}</p>
          <h1 className="font-display text-[26px] font-bold font-mono tracking-tight">{order.reference}</h1>
        </div>
        <div className="flex gap-2 items-center">
          <Badge tone={st.tone} className="!text-xs !px-3 !py-1">
            {st.label}
          </Badge>
          <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone} className="!text-xs !px-3 !py-1">
            {PAYMENT_STATUS[order.paymentStatus].label}
          </Badge>
        </div>
      </div>

      {st.step >= 0 && (
        <Card className="mb-5">
          <Steps current={st.step} labels={["Commandée", "Payée", "Confirmée", "Préparée", "En route", "Livrée"]} />
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Articles</h2>
            <ul className="divide-y divide-[var(--color-sand)]">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  {it.imageSnapshot && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageSnapshot} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/produit/${it.product.slug}`} className="font-medium text-sm hover:text-[var(--color-gold-dark)]">
                      {it.titleSnapshot}
                    </Link>
                    <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5 mt-0.5">
                      <GradeBadge grade={it.gradeSnapshot} size="sm" /> {it.defectSnapshot}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                      {it.product.seller.seller?.shopName} · {phoneFR(it.product.seller.seller?.contactPhone)}
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <p className="font-semibold">{money(it.lineTotal)}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {it.quantity} × {money(it.unitPrice, false)}
                    </p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      Vendeur {money(it.sellerAmount, false)} · LBD {it.commissionPct} %
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-[var(--color-sand)] grid gap-1.5 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
              <Row k="Sous-total" v={money(order.subtotal)} />
              <Row k="Livraison" v={money(order.deliveryFee)} />
              <Row k="Total client" v={money(order.total)} strong />
              <Row k="Commission Le Beau Défaut" v={money(commission)} />
            </dl>
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Journal de la commande</h2>
            <ol className="flex flex-col gap-3">
              {order.events.map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-gold)] mt-2 shrink-0" />
                  <div>
                    <p className="font-medium">{e.label}</p>
                    {e.note && <p className="text-xs text-[var(--color-ink-muted)]">{e.note}</p>}
                    <p className="text-[11px] text-[var(--color-ink-muted)]">{dateTimeFR(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {next.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-3">Faire avancer</h2>
              <div className="flex flex-col gap-2">
                {next.map((n) => (
                  <form key={n.status} action={setOrderStatusAction} className="flex flex-col gap-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input type="hidden" name="status" value={n.status} />
                    <button
                      className={`btn w-full ${
                        ["ANNULEE", "REMBOURSEE"].includes(n.status)
                          ? "btn-outline !text-[var(--color-danger)]"
                          : "btn-primary"
                      }`}
                    >
                      {n.label}
                    </button>
                  </form>
                ))}
              </div>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-3">
                Le client est notifié à chaque changement. À la livraison, les versements vendeurs sont créés
                automatiquement.
              </p>
            </Card>
          )}

          <Card>
            <h2 className="font-display text-lg font-bold mb-2">Client</h2>
            <p className="text-sm font-medium">{order.recipientName}</p>
            <a href={`tel:${order.recipientPhone}`} className="text-sm text-[var(--color-gold-deep)] underline">
              {phoneFR(order.recipientPhone)}
            </a>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">
              {order.quartier}, {order.city}
            </p>
            {order.landmark && <p className="text-xs italic text-[var(--color-ink-muted)]">{order.landmark}</p>}
            {order.notes && (
              <p className="text-xs mt-2 p-2 rounded-lg bg-[var(--color-cream-deep)]">« {order.notes} »</p>
            )}
            <p className="text-xs text-[var(--color-ink-muted)] mt-3 pt-3 border-t border-[var(--color-sand)]">
              Compte : {order.buyer.firstName} {order.buyer.lastName} · {order.buyer.email}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">Paiement : {paymentMethodLabel(order.paymentMethod)}</p>
            {order.paymentRef && <p className="text-xs text-[var(--color-ink-muted)] font-mono">Réf. {order.paymentRef}</p>}
          </Card>

          {order.delivery && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg font-bold">Livraison</h2>
                <Badge tone={DELIVERY_STATUS[order.delivery.status].tone}>{DELIVERY_STATUS[order.delivery.status].label}</Badge>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] font-mono mb-3">Suivi {order.delivery.trackingCode}</p>

              {order.delivery.courier && (
                <p className="text-sm mb-3 flex items-center gap-2">
                  <Icon name="truck" size={15} className="text-[var(--color-gold)]" />
                  {order.delivery.courier.user.firstName} {order.delivery.courier.user.lastName} ·{" "}
                  {VEHICLES[order.delivery.courier.vehicle]?.label}
                </p>
              )}

              {order.delivery.status !== "LIVREE" && !["ANNULEE", "REMBOURSEE", "LIVREE"].includes(order.status) && (
                <form action={assignCourierAction} className="flex gap-2">
                  <input type="hidden" name="deliveryId" value={order.delivery.id} />
                  <select name="courierId" defaultValue={order.delivery.courierId ?? ""} className="field">
                    <option value="">— Aucun livreur —</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.user.firstName} {c.user.lastName} · {VEHICLES[c.vehicle]?.label} · {c.zones} ·{" "}
                        {c.status === "DISPONIBLE" ? "dispo" : c.status === "EN_COURSE" ? "en course" : "hors ligne"}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary btn-sm">OK</button>
                </form>
              )}
              {order.delivery.failureNote && (
                <p className="text-xs text-[var(--color-danger)] mt-2">{order.delivery.failureNote}</p>
              )}
            </Card>
          )}

          {order.payouts.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-2">Versements vendeurs</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {order.payouts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{p.seller.shopName}</span>
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      {money(p.amount)}
                      <Badge tone={p.status === "PAYE" ? "success" : "warning"}>{p.status === "PAYE" ? "Payé" : "À verser"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold text-base" : ""}`}>
      <dt className={strong ? "" : "text-[var(--color-ink-muted)]"}>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
