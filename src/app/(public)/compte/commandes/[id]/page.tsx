import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { money, dateFR, dateTimeFR, phoneFR } from "@/lib/format";
import {
  ORDER_STATUS,
  DELIVERY_STATUS,
  PAYMENT_STATUS,
  paymentMethodLabel,
  VEHICLES,
  CLAIM_STATUS,
  claimTypeLabel,
  claimResolutionLabel,
} from "@/lib/constants";
import { cancelOrderAction } from "@/lib/actions/shop";
import { AccountLayout } from "@/components/AccountNav";
import ClaimForm from "@/components/ClaimForm";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, Steps, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Détail de la commande" };

const STEP_LABELS = ["Commandée", "Payée", "Confirmée", "Préparée", "En route", "Livrée"];

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const { id } = await params;
  const { nouveau } = await searchParams;
  const user = await requireUser(`/compte/commandes/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { slug: true, sellerId: true } } } },
      events: { orderBy: { createdAt: "asc" } },
      delivery: { include: { courier: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } } },
      claims: { orderBy: { createdAt: "desc" } },
    },
  });

  // Le client voit sa commande ; l'admin voit tout.
  if (!order || (order.buyerId !== user.id && user.role !== "ADMIN")) notFound();

  const st = ORDER_STATUS[order.status];
  const canCancel = ["EN_ATTENTE_PAIEMENT", "PAYEE", "CONFIRMEE"].includes(order.status) && order.buyerId === user.id;
  const reviewed = await prisma.review.findMany({
    where: { userId: user.id, productId: { in: order.items.map((i) => i.productId) } },
    select: { productId: true },
  });
  const reviewedIds = new Set(reviewed.map((r) => r.productId));

  return (
    <AccountLayout active="/compte/commandes" user={user}>
      <Link href="/compte/commandes" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Mes commandes
      </Link>

      {nouveau && (
        <div className="surface p-6 mb-6 text-center border-t-4 !border-t-[var(--color-gold)]">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-grade-a-bg)] text-[var(--color-success)] mb-3">
            <Icon name="check" size={28} strokeWidth={2.2} />
          </span>
          <h2 className="font-display text-2xl font-bold">Merci, c&apos;est commandé !</h2>
          <p className="font-script text-gilded text-2xl mt-1">Un petit défaut, une grande économie.</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-3 max-w-md mx-auto">
            {order.paymentMethod.startsWith("MOBILE_MONEY")
              ? "Validez la demande de paiement reçue sur votre téléphone. La préparation démarre dès réception."
              : "Le vendeur confirme la disponibilité, puis un livreur vous appelle pour convenir du passage."}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="font-mono text-xs text-[var(--color-ink-muted)]">{order.reference}</p>
          <h1 className="font-display text-[26px] font-bold">Commande du {dateFR(order.createdAt)}</h1>
        </div>
        <Badge tone={st.tone} className="!text-xs !px-3 !py-1">
          {st.label}
        </Badge>
      </div>

      {st.step >= 0 && (
        <div className="surface p-5 mb-5">
          <Steps current={st.step} labels={STEP_LABELS} />
        </div>
      )}

      {order.status === "EN_ATTENTE_PAIEMENT" && (
        <div className="mb-5">
          <Alert tone="warning" title="Paiement en attente">
            Composez le code de paiement {order.paymentMethod === "MOBILE_MONEY_MTN" ? "MTN MoMo" : "Airtel Money"} ou
            validez la notification reçue. Référence à indiquer : <strong className="font-mono">{order.reference}</strong>.
          </Alert>
        </div>
      )}
      {order.cancelReason && (
        <div className="mb-5">
          <Alert tone="danger" title="Commande annulée">
            {order.cancelReason}
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          {/* Articles */}
          <section className="surface p-5">
            <h2 className="font-display text-lg font-bold mb-4">Articles</h2>
            <ul className="flex flex-col divide-y divide-[var(--color-sand)]">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
                  {it.imageSnapshot && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageSnapshot} alt="" className="h-20 w-20 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/produit/${it.product.slug}`}
                      className="font-display font-semibold hover:text-[var(--color-gold-dark)] line-clamp-2"
                    >
                      {it.titleSnapshot}
                    </Link>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1 flex items-start gap-1.5">
                      <GradeBadge grade={it.gradeSnapshot} size="sm" />
                      <span className="pt-0.5">Défaut accepté : {it.defectSnapshot}</span>
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
                      <span className="text-sm">
                        {it.quantity} × {money(it.unitPrice)}
                      </span>
                      {order.status === "LIVREE" && order.buyerId === user.id && (
                        <Link href={`/produit/${it.product.slug}#avis`} className="btn btn-outline btn-sm">
                          <Icon name="star" size={13} />
                          {reviewedIds.has(it.productId) ? "Modifier mon avis" : "Donner mon avis"}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Historique */}
          <section className="surface p-5">
            <h2 className="font-display text-lg font-bold mb-4">Suivi</h2>
            <ol className="relative border-l-2 border-[var(--color-sand)] ml-2 flex flex-col gap-5">
              {[...order.events].reverse().map((ev, i) => (
                <li key={ev.id} className="ml-5 relative">
                  <span
                    className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-[var(--color-linen)] ${
                      i === 0 ? "bg-[var(--color-gold)] ring-4 ring-[var(--color-gold-pale)]" : "bg-[var(--color-sand)]"
                    }`}
                  />
                  <p className="text-sm font-medium">{ev.label}</p>
                  {ev.note && <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{ev.note}</p>}
                  <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">{dateTimeFR(ev.createdAt)}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Réclamations — la garantie « défaut conforme » */}
          {order.claims.length > 0 && (
            <section className="surface p-5">
              <h2 className="font-display text-lg font-bold mb-4">Réclamations</h2>
              <ul className="flex flex-col gap-4">
                {order.claims.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    {c.photoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photoUrl} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-[var(--color-ink-muted)]">{c.reference}</span>
                        <Badge tone={CLAIM_STATUS[c.status].tone}>{CLAIM_STATUS[c.status].label}</Badge>
                      </div>
                      <p className="text-sm font-medium mt-0.5">{claimTypeLabel(c.type)}</p>
                      <p className="text-sm text-[var(--color-ink-muted)]">{c.description}</p>
                      {c.status === "ACCEPTEE" && (
                        <p className="text-sm mt-1 text-[var(--color-success)]">
                          {claimResolutionLabel(c.resolution)}
                          {c.refundAmount > 0 ? ` · ${money(c.refundAmount)} remboursés` : ""}
                        </p>
                      )}
                      {c.adminNote && <p className="text-xs italic text-[var(--color-ink-muted)] mt-1">« {c.adminNote} »</p>}
                      <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">Ouverte le {dateFR(c.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {order.status === "LIVREE" &&
            order.buyerId === user.id &&
            !order.claims.some((c) => ["OUVERTE", "EN_EXAMEN"].includes(c.status)) && (
              <ClaimForm
                orderId={order.id}
                items={order.items.map((i) => ({ id: i.id, title: i.titleSnapshot }))}
              />
            )}
        </div>

        <div className="flex flex-col gap-5">
          <section className="surface p-5">
            <h2 className="font-display text-base font-bold mb-3">Paiement</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Sous-total</dt>
                <dd>{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-muted)]">Livraison</dt>
                <dd>{order.deliveryFee ? money(order.deliveryFee) : "Offerte / retrait"}</dd>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-[var(--color-sand)]">
                <dt>Total</dt>
                <dd className="font-display text-lg">{money(order.total)}</dd>
              </div>
              <div className="flex justify-between items-center pt-2">
                <dt className="text-[var(--color-ink-muted)]">{paymentMethodLabel(order.paymentMethod)}</dt>
                <dd>
                  <Badge tone={PAYMENT_STATUS[order.paymentStatus].tone}>
                    {PAYMENT_STATUS[order.paymentStatus].label}
                  </Badge>
                </dd>
              </div>
            </dl>
          </section>

          <section className="surface p-5">
            <h2 className="font-display text-base font-bold mb-3">Livraison</h2>
            <p className="text-sm font-medium">{order.recipientName}</p>
            <p className="text-sm text-[var(--color-ink-muted)]">{phoneFR(order.recipientPhone)}</p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">
              {order.quartier}, {order.city}
            </p>
            {order.landmark && <p className="text-xs text-[var(--color-ink-muted)] italic mt-1">{order.landmark}</p>}

            {order.delivery && (
              <div className="mt-4 pt-4 border-t border-[var(--color-sand)] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-muted)]">Suivi</span>
                  <span className="font-mono text-xs">{order.delivery.trackingCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-ink-muted)]">Statut</span>
                  <Badge tone={DELIVERY_STATUS[order.delivery.status].tone}>
                    {DELIVERY_STATUS[order.delivery.status].label}
                  </Badge>
                </div>
                {order.delivery.courier && (
                  <div className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-[var(--color-cream-deep)]">
                    <span className="h-9 w-9 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] grid place-items-center">
                      <Icon name="truck" size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {order.delivery.courier.user.firstName} {order.delivery.courier.user.lastName[0]}.
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">
                        {VEHICLES[order.delivery.courier.vehicle]?.label}
                      </p>
                    </div>
                    {order.delivery.courier.user.phone &&
                      !["LIVREE", "ECHEC"].includes(order.delivery.status) && (
                        <a
                          href={`tel:${order.delivery.courier.user.phone}`}
                          className="btn btn-outline btn-sm !px-2.5"
                          aria-label="Appeler le livreur"
                        >
                          <Icon name="phone" size={14} />
                        </a>
                      )}
                  </div>
                )}
              </div>
            )}
          </section>

          {canCancel && (
            <form action={cancelOrderAction} className="surface p-5">
              <input type="hidden" name="orderId" value={order.id} />
              <h2 className="font-display text-base font-bold mb-2">Annuler la commande</h2>
              <p className="text-xs text-[var(--color-ink-muted)] mb-3">
                Possible tant que le colis n&apos;a pas été récupéré par le livreur.
              </p>
              <select name="reason" className="field mb-3" defaultValue="J'ai changé d'avis">
                <option>J&apos;ai changé d&apos;avis</option>
                <option>J&apos;ai trouvé moins cher ailleurs</option>
                <option>Délai de livraison trop long</option>
                <option>Erreur dans ma commande</option>
              </select>
              <button className="btn btn-outline w-full !text-[var(--color-danger)] !border-[var(--color-danger)]/40">
                Annuler la commande
              </button>
            </form>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
