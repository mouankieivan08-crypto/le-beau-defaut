import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateTimeFR, dateFR, phoneFR, relativeFR, waLink } from "@/lib/format";
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  DELIVERY_STATUS,
  CLAIM_STATUS,
  DEPOSIT_NUMBERS,
  INTERNAL_NOTE_LABEL,
  paymentMethodLabel,
  claimTypeLabel,
  VEHICLES,
} from "@/lib/constants";
import {
  setOrderStatusAction,
  assignCourierAction,
  confirmDepositAction,
  rejectDepositAction,
  addOrderNoteAction,
  notifyCustomerAction,
} from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, Card, Steps, Alert } from "@/components/ui";

/** Étapes suivantes possibles, une fois le paiement confirmé. */
const NEXT_STEPS: Record<string, { status: string; label: string }[]> = {
  EN_ATTENTE_PAIEMENT: [{ status: "ANNULEE", label: "Annuler la commande" }],
  PAYEE: [
    { status: "CONFIRMEE", label: "Confirmer la commande" },
    { status: "REMBOURSEE", label: "Rembourser" },
  ],
  CONFIRMEE: [
    { status: "EN_PREPARATION", label: "Colis préparé" },
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
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            city: true,
            quartier: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                slug: true,
                reference: true,
                quantity: true,
                seller: { select: { seller: { select: { shopName: true, contactPhone: true } } } },
              },
            },
          },
        },
        events: { orderBy: { createdAt: "desc" } },
        delivery: { include: { courier: { include: { user: true } } } },
        payouts: { include: { seller: true } },
        claims: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.courierProfile.findMany({ include: { user: true }, orderBy: { status: "asc" } }),
  ]);
  if (!order) notFound();

  const [history, buyerStats, openClaims, actors] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: order.buyer.id, NOT: { id: order.id } },
      select: { id: true, reference: true, status: true, total: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.order.aggregate({
      where: { buyerId: order.buyer.id, paymentStatus: "PAYE" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.claim.count({ where: { buyerId: order.buyer.id, status: { in: ["OUVERTE", "EN_EXAMEN"] } } }),
    prisma.user.findMany({
      where: { id: { in: order.events.map((e) => e.actorId).filter((x): x is string => !!x) } },
      select: { id: true, firstName: true, role: true },
    }),
  ]);
  const actorName = (id: string | null) => {
    const a = actors.find((x) => x.id === id);
    if (!a) return "Système";
    return a.role === "ADMIN" ? `${a.firstName} (équipe)` : a.role === "CLIENT" ? `${a.firstName} (client)` : a.firstName;
  };

  const st = ORDER_STATUS[order.status] ?? { label: order.status, tone: "neutral", step: -1 };
  const pay = PAYMENT_STATUS[order.paymentStatus] ?? { label: order.paymentStatus, tone: "neutral" };
  const commission = order.items.reduce((s, i) => s + (i.lineTotal - i.sellerAmount), 0);
  const next = NEXT_STEPS[order.status] ?? [];
  // Tant que le paiement n'est pas confirmé, la seule action principale est la carte de confirmation.
  const mainStep = order.paymentStatus === "PAYE" ? next.find((n) => !["ANNULEE", "REMBOURSEE"].includes(n.status)) : undefined;
  const awaitingPayment = order.paymentStatus === "EN_ATTENTE" && !["ANNULEE", "REMBOURSEE"].includes(order.status);
  const phone = order.recipientPhone || order.buyer.phone;
  const wa = waLink(phone, `Bonjour ${order.buyer.firstName}, c'est Le Beau Défaut au sujet de votre commande ${order.reference} (${money(order.total)}).`);
  const waConfirmed = waLink(
    phone,
    `Bonjour ${order.buyer.firstName}, nous avons bien reçu votre paiement de ${money(order.total)} pour la commande ${order.reference}. Elle est confirmée, nous vous appelons pour la livraison. Merci !`
  );

  return (
    <>
      <Link href="/admin/commandes" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Commandes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Passée le {dateTimeFR(order.createdAt)} · {relativeFR(order.createdAt)}
          </p>
          <h1 className="font-display text-[26px] font-bold font-mono tracking-tight">{order.reference}</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {order.buyer.firstName} {order.buyer.lastName} · {order.items.length} article{order.items.length > 1 ? "s" : ""} ·{" "}
            <strong className="text-[var(--color-ink)]">{money(order.total)}</strong>
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Badge tone={st.tone} className="!text-xs !px-3 !py-1">
            {st.label}
          </Badge>
          <Badge tone={pay.tone} className="!text-xs !px-3 !py-1">
            Paiement : {pay.label}
          </Badge>
          {order.claims.length > 0 && (
            <Badge tone="danger" className="!text-xs !px-3 !py-1">
              {order.claims.length} réclamation{order.claims.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* --------- Vérification du paiement : la décision la plus importante, tout en haut --------- */}
      {awaitingPayment && (
        <Card className="mb-5 border-l-4 !border-l-[var(--color-gold)]">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Icon name="wallet" size={18} className="text-[var(--color-gold-dark)]" /> Paiement du client à confirmer
              </h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                {order.buyer.firstName} {order.buyer.lastName} doit avoir payé <strong className="text-[var(--color-ink)]">{money(order.total)}</strong>. Vous avez vu la preuve ? Confirmez.
              </p>
            </div>
            {order.paymentDeclaredAt ? (
              <Badge tone="info">Preuve envoyée {relativeFR(order.paymentDeclaredAt)}</Badge>
            ) : (
              <Badge tone="warning">Preuve à voir sur WhatsApp</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
            <div>
              {order.paymentProofUrl ? (
                <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="block group" title="Ouvrir la capture en grand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.paymentProofUrl}
                    alt={`Preuve de paiement ${order.reference}`}
                    className="w-full max-h-72 object-contain rounded-xl border border-[var(--color-sand)] bg-[var(--color-cream-deep)] group-hover:opacity-90"
                  />
                  <span className="text-[11px] text-[var(--color-ink-muted)] underline">Agrandir la capture</span>
                </a>
              ) : (
                <div className="h-36 rounded-xl border border-dashed border-[var(--color-sand)] grid place-items-center text-xs text-[var(--color-ink-muted)] text-center p-3">
                  La preuve arrive sur WhatsApp.
                </div>
              )}
              {order.paymentRef && (
                <p className="text-xs mt-2">
                  Transaction indiquée : <span className="font-mono font-semibold">{order.paymentRef}</span>
                </p>
              )}
              {order.paymentRejectReason && (
                <p className="text-xs mt-2 text-[var(--color-danger)]">Preuve précédente refusée : {order.paymentRejectReason}</p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <form action={confirmDepositAction} className="flex flex-col gap-3">
                <input type="hidden" name="orderId" value={order.id} />
                <button className="btn btn-lg w-full !bg-[var(--color-grade-a)] !text-white">
                  <Icon name="check-circle" size={18} /> Confirmer le paiement et la commande
                </button>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  Le client est notifié aussitôt : « Commande confirmée ». Vous gérez ensuite la préparation et la livraison ci-dessous.
                </p>
                <details>
                  <summary className="text-xs text-[var(--color-ink-muted)] cursor-pointer">Ajouter un détail (facultatif)</summary>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="label" htmlFor="operator">
                        Reçu sur
                      </label>
                      <select id="operator" name="operator" className="field" defaultValue="">
                        <option value="">— Non précisé —</option>
                        {DEPOSIT_NUMBERS.map((n) => (
                          <option key={n.raw} value={`${n.operator} ${n.display}`}>
                            {n.operator} · {n.display}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label" htmlFor="transaction">
                        N° de transaction
                      </label>
                      <input id="transaction" name="transaction" defaultValue={order.paymentRef ?? ""} className="field" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label" htmlFor="message">
                        Message personnalisé au client
                      </label>
                      <textarea id="message" name="message" rows={2} className="field" placeholder="Laissez vide pour le message standard." />
                    </div>
                  </div>
                </details>
              </form>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-sand)]">
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                    <Icon name="phone" size={14} /> Ouvrir WhatsApp du client
                  </a>
                )}
                <a href={`tel:${phone}`} className="btn btn-outline btn-sm">
                  <Icon name="phone" size={14} /> Appeler
                </a>
                <details className="w-full">
                  <summary className="btn btn-ghost btn-sm cursor-pointer list-none text-[var(--color-danger)]">Refuser la preuve…</summary>
                  <form action={rejectDepositAction} className="flex flex-wrap items-center gap-2 mt-2">
                    <input type="hidden" name="orderId" value={order.id} />
                    <input name="reason" placeholder="Motif : montant différent, dépôt introuvable…" className="field !py-1.5 text-xs flex-1 min-w-[220px]" />
                    <button className="btn btn-sm btn-outline !text-[var(--color-danger)]">Confirmer le refus</button>
                  </form>
                </details>
              </div>
            </div>
          </div>
        </Card>
      )}

      {order.paymentStatus === "PAYE" && waConfirmed && order.status === "CONFIRMEE" && (
        <div className="mb-5">
          <Alert tone="success" title="Paiement confirmé">
            Payée le {dateTimeFR(order.paidAt)}
            {order.paymentRef ? ` · transaction ${order.paymentRef}` : ""}. Le client a été notifié.{" "}
            <a href={waConfirmed} target="_blank" rel="noreferrer" className="underline font-semibold">
              Lui confirmer aussi sur WhatsApp
            </a>
          </Alert>
        </div>
      )}

      {st.step >= 0 && (
        <Card className="mb-5">
          <Steps current={st.step} labels={["Commandée", "Payée", "Confirmée", "Préparée", "En route", "Livrée"]} />
          {mainStep && (
            <form action={setOrderStatusAction} className="mt-4 pt-4 border-t border-[var(--color-sand)] flex items-center justify-between gap-3 flex-wrap">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value={mainStep.status} />
              <p className="text-sm text-[var(--color-ink-muted)]">
                Étape suivante — le client la verra dans son suivi et recevra une notification.
              </p>
              <button className="btn btn-primary">
                <Icon name="arrow-right" size={15} /> {mainStep.label}
              </button>
            </form>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Ce qu&apos;il a commandé</h2>
            <ul className="divide-y divide-[var(--color-sand)]">
              {order.items.map((it) => (
                <li key={it.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  {it.imageSnapshot && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageSnapshot} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/produit/${it.product.slug}`} className="font-medium text-sm hover:text-[var(--color-gold-dark)]">
                      {it.titleSnapshot}
                    </Link>
                    <p className="text-[11px] font-mono text-[var(--color-ink-muted)]">{it.product.reference}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5 mt-0.5">
                      <GradeBadge grade={it.gradeSnapshot} size="sm" /> {it.defectSnapshot}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                      {it.product.seller.seller?.shopName} · {phoneFR(it.product.seller.seller?.contactPhone)} · stock restant {it.product.quantity}
                    </p>
                  </div>
                  <div className="text-right text-sm whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                    <p className="font-semibold">{money(it.lineTotal)}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {it.quantity} × {money(it.unitPrice, false)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-[var(--color-sand)] grid gap-1.5 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
              <Row k="Sous-total" v={money(order.subtotal)} />
              <Row k={`Livraison (${order.quartier})`} v={money(order.deliveryFee)} />
              {order.discount > 0 && <Row k="Remise" v={`− ${money(order.discount)}`} />}
              <Row k="Total à encaisser" v={money(order.total)} strong />
              <Row k="Commission Le Beau Défaut" v={money(commission)} />
              <Row k="Moyen de paiement" v={paymentMethodLabel(order.paymentMethod)} />
            </dl>
          </Card>

          {order.claims.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg font-bold">Réclamations sur cette commande</h2>
                <Link href="/admin/reclamations" className="btn btn-ghost btn-sm">
                  Gérer <Icon name="arrow-right" size={13} />
                </Link>
              </div>
              <ul className="flex flex-col gap-3">
                {order.claims.map((c) => (
                  <li key={c.id} className="p-3 rounded-xl bg-[var(--color-cream-deep)]/60">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold">
                        <span className="font-mono text-xs">{c.reference}</span> · {claimTypeLabel(c.type)}
                      </p>
                      <Badge tone={CLAIM_STATUS[c.status]?.tone ?? "neutral"}>{CLAIM_STATUS[c.status]?.label ?? c.status}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1 line-clamp-3">{c.description}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">{relativeFR(c.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Historique complet</h2>
            <form action={addOrderNoteAction} className="flex gap-2 mb-4">
              <input type="hidden" name="orderId" value={order.id} />
              <input name="note" className="field" placeholder="Ajouter une note interne (jamais vue par le client)…" />
              <button className="btn btn-outline btn-sm whitespace-nowrap">
                <Icon name="plus" size={13} /> Note
              </button>
            </form>
            <ol className="flex flex-col gap-3">
              {order.events.map((e) => {
                const internal = e.label === INTERNAL_NOTE_LABEL;
                return (
                  <li key={e.id} className={`flex gap-3 text-sm ${internal ? "p-2 -mx-2 rounded-lg bg-[var(--color-gold-pale)]/30" : ""}`}>
                    <span className={`h-2 w-2 rounded-full mt-2 shrink-0 ${internal ? "bg-[var(--color-ink-muted)]" : "bg-[var(--color-gold)]"}`} />
                    <div>
                      <p className="font-medium">
                        {e.label}
                        {internal && <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] ml-2">équipe seulement</span>}
                      </p>
                      {e.note && <p className="text-xs text-[var(--color-ink-muted)] whitespace-pre-line">{e.note}</p>}
                      <p className="text-[11px] text-[var(--color-ink-muted)]">
                        {dateTimeFR(e.createdAt)} · {actorName(e.actorId)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {/* Fiche client complète */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg font-bold">Le client</h2>
              <Link href={`/admin/utilisateurs/${order.buyer.id}`} className="btn btn-ghost btn-sm">
                Fiche <Icon name="arrow-right" size={13} />
              </Link>
            </div>
            <p className="text-base font-semibold">
              {order.buyer.firstName} {order.buyer.lastName}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)]">{order.buyer.email}</p>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Client depuis le {dateFR(order.buyer.createdAt)} · dernière connexion {relativeFR(order.buyer.lastLoginAt)}
            </p>
            {!order.buyer.isActive && (
              <Badge tone="danger" className="mt-1">
                Compte désactivé
              </Badge>
            )}

            <div className="grid grid-cols-3 gap-2 my-3 text-center">
              <MiniStat label="Commandes" value={String(history.length + 1)} />
              <MiniStat label="Payé au total" value={money(buyerStats._sum.total ?? 0, false)} />
              <MiniStat label="Litiges ouverts" value={String(openClaims)} danger={openClaims > 0} />
            </div>

            <div className="flex flex-wrap gap-2">
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="btn btn-sm !bg-[#25D366] !text-white">
                  <Icon name="phone" size={13} /> WhatsApp
                </a>
              )}
              <a href={`tel:${phone}`} className="btn btn-outline btn-sm">
                <Icon name="phone" size={13} /> {phoneFR(phone)}
              </a>
              <a href={`mailto:${order.buyer.email}`} className="btn btn-outline btn-sm">
                <Icon name="mail" size={13} /> E-mail
              </a>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-sand)]">
              <p className="label">Livrer à</p>
              <p className="text-sm font-medium">{order.recipientName}</p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                {order.quartier}, {order.city}
              </p>
              {order.landmark && <p className="text-xs italic text-[var(--color-ink-muted)]">Repère : {order.landmark}</p>}
              {order.notes && <p className="text-xs mt-2 p-2 rounded-lg bg-[var(--color-cream-deep)]">« {order.notes} »</p>}
            </div>

            {history.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--color-sand)]">
                <p className="label">Ses autres commandes</p>
                <ul className="flex flex-col gap-1.5">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-2 text-xs">
                      <Link href={`/admin/commandes/${h.id}`} className="font-mono hover:text-[var(--color-gold-dark)]">
                        {h.reference}
                      </Link>
                      <span className="flex items-center gap-1.5">
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{money(h.total, false)}</span>
                        <Badge tone={ORDER_STATUS[h.status]?.tone ?? "neutral"}>{ORDER_STATUS[h.status]?.label ?? h.status}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {next.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-3">Faire avancer</h2>
              <div className="flex flex-col gap-2">
                {next.map((n) => {
                  const danger = ["ANNULEE", "REMBOURSEE"].includes(n.status);
                  return (
                    <form key={n.status} action={setOrderStatusAction} className="flex flex-col gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="status" value={n.status} />
                      {danger && <input name="note" className="field !py-1.5 text-xs" placeholder="Motif (envoyé au client)" />}
                      <button className={`btn w-full ${danger ? "btn-outline !text-[var(--color-danger)]" : "btn-primary"}`}>{n.label}</button>
                    </form>
                  );
                })}
              </div>
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-3">
                Le client reçoit une notification à chaque étape. À la livraison, les versements vendeurs sont créés
                automatiquement.
              </p>
            </Card>
          )}

          <Card>
            <h2 className="font-display text-lg font-bold mb-1">Écrire au client</h2>
            <p className="text-[11px] text-[var(--color-ink-muted)] mb-3">Il le reçoit dans ses notifications, et c&apos;est noté dans l&apos;historique.</p>
            <form action={notifyCustomerAction} className="flex flex-col gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <textarea name="body" rows={3} required className="field" placeholder="Ex. Le livreur passera demain entre 10 h et 12 h." />
              <button className="btn btn-outline btn-sm">
                <Icon name="bell" size={13} /> Envoyer la notification
              </button>
            </form>
          </Card>

          {order.delivery && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg font-bold">Livraison</h2>
                <Badge tone={DELIVERY_STATUS[order.delivery.status]?.tone ?? "neutral"}>
                  {DELIVERY_STATUS[order.delivery.status]?.label ?? order.delivery.status}
                </Badge>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] font-mono mb-3">Suivi {order.delivery.trackingCode}</p>

              {order.delivery.courier && (
                <p className="text-sm mb-3 flex items-center gap-2">
                  <Icon name="truck" size={15} className="text-[var(--color-gold)]" />
                  {order.delivery.courier.user.firstName} {order.delivery.courier.user.lastName} ·{" "}
                  {VEHICLES[order.delivery.courier.vehicle]?.label} · {phoneFR(order.delivery.courier.user.phone)}
                </p>
              )}

              {order.paymentStatus !== "PAYE" && order.status === "EN_ATTENTE_PAIEMENT" ? (
                <p className="text-xs text-[var(--color-ink-muted)]">Le livreur s&apos;assigne une fois le paiement confirmé.</p>
              ) : (
                order.delivery.status !== "LIVREE" &&
                !["ANNULEE", "REMBOURSEE", "LIVREE"].includes(order.status) && (
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
                )
              )}
              {order.delivery.failureNote && <p className="text-xs text-[var(--color-danger)] mt-2">{order.delivery.failureNote}</p>}
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
    <div className={`flex justify-between gap-3 ${strong ? "font-semibold text-base" : ""}`}>
      <dt className={strong ? "" : "text-[var(--color-ink-muted)]"}>{k}</dt>
      <dd className="text-right">{v}</dd>
    </div>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-[var(--color-cream-deep)]/70 px-2 py-2">
      <p className={`text-sm font-bold ${danger ? "text-[var(--color-danger)]" : ""}`} style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}
