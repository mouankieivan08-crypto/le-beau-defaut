import Link from "next/link";
import ResponsiveTable from "@/components/ResponsiveTable";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateTimeFR, phoneFR, relativeFR, waLink } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS, DELIVERY_STATUS, CITIES } from "@/lib/constants";
import { confirmDepositAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, PageHeader, EmptyState, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Commandes" };

/**
 * Onglets pensés pour le travail de l'équipe : on commence par ce qui attend une action.
 * « À confirmer » = la preuve Mobile Money est arrivée, il reste à vérifier et confirmer.
 */
const TABS = [
  { key: "", label: "Toutes" },
  { key: "A_CONFIRMER", label: "Preuve reçue · à confirmer" },
  { key: "EN_ATTENTE_PAIEMENT", label: "Paiement attendu" },
  { key: "CONFIRMEE", label: "À préparer" },
  { key: "EN_LIVRAISON", label: "En livraison" },
  { key: "LIVREE", label: "Livrées" },
  { key: "ANNULEE", label: "Annulées" },
];

function whereForTab(key: string): Prisma.OrderWhereInput {
  switch (key) {
    case "A_CONFIRMER":
      return { status: "EN_ATTENTE_PAIEMENT", paymentStatus: "EN_ATTENTE", paymentDeclaredAt: { not: null } };
    case "EN_ATTENTE_PAIEMENT":
      return { status: "EN_ATTENTE_PAIEMENT", paymentDeclaredAt: null };
    case "CONFIRMEE":
      return { status: { in: ["PAYEE", "CONFIRMEE", "EN_PREPARATION"] } };
    case "":
      return {};
    default:
      return { status: key };
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; ville?: string; paiement?: string; page?: string }>;
}) {
  await requireAdmin("/admin/commandes");
  const { statut = "", q = "", ville = "", paiement = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const PER = 25;

  const where: Prisma.OrderWhereInput = { ...whereForTab(statut) };
  if (ville) where.city = ville;
  if (paiement) where.paymentStatus = paiement;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { recipientName: { contains: q, mode: "insensitive" } },
      { recipientPhone: { contains: q.replace(/\s/g, ""), mode: "insensitive" } },
      { paymentRef: { contains: q, mode: "insensitive" } },
      { buyer: { email: { contains: q, mode: "insensitive" } } },
      { buyer: { phone: { contains: q.replace(/\s/g, ""), mode: "insensitive" } } },
      { buyer: { lastName: { contains: q, mode: "insensitive" } } },
      { buyer: { firstName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [orders, total, sums, ...tabCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, _count: { select: { orders: true } } } },
        items: { select: { id: true, titleSnapshot: true, quantity: true, imageSnapshot: true } },
        delivery: { select: { status: true, courier: { select: { user: { select: { firstName: true } } } } } },
        _count: { select: { claims: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PER,
      take: PER,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, AND: [{ status: { notIn: ["ANNULEE", "REMBOURSEE"] } }] },
      _sum: { total: true, deliveryFee: true },
    }),
    ...TABS.map((t) => prisma.order.count({ where: whereForTab(t.key) })),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER));

  const qs = (patch: Record<string, string>) => {
    const sp = new URLSearchParams(
      Object.entries({ statut, q, ville, paiement, ...patch }).filter(([, v]) => v) as [string, string][]
    );
    return `/admin/commandes${sp.toString() ? `?${sp}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Commandes"
        subtitle="Chaque ligne : le client, ce qu'il a commandé, où en est son paiement Mobile Money. Vérifiez la preuve sur WhatsApp, puis confirmez."
        action={
          <a href="/api/export/commandes" className="btn btn-outline btn-sm" download>
            <Icon name="download" size={14} /> Export Excel
          </a>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Commandes (filtre)" value={total} icon="package" />
        <Stat
          label="Preuves à vérifier"
          value={tabCounts[1] as number}
          icon="wallet"
          tone={(tabCounts[1] as number) > 0 ? "danger" : "success"}
          href="/admin/commandes?statut=A_CONFIRMER"
        />
        <Stat label="Montant (hors annulées)" value={money(sums._sum.total ?? 0)} icon="chart" tone="gold" />
        <Stat label="Frais de livraison" value={money(sums._sum.deliveryFee ?? 0)} icon="truck" />
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t, i) => (
          <Link
            key={t.key}
            href={qs({ statut: t.key, page: "" })}
            className={`chip !text-xs !px-3 !py-1.5 whitespace-nowrap ${
              statut === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)]"
            }`}
          >
            {t.label} <span className={t.key === "A_CONFIRMER" && (tabCounts[i] as number) > 0 ? "font-bold text-[var(--color-danger)]" : "opacity-60"}>{tabCounts[i] as number}</span>
          </Link>
        ))}
      </div>

      <form action="/admin/commandes" className="flex flex-wrap gap-2 mb-5">
        <input type="hidden" name="statut" value={statut} />
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input name="q" defaultValue={q} placeholder="Référence, nom, téléphone, e-mail, n° transaction…" className="field pl-8" />
          <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        </div>
        <select name="ville" defaultValue={ville} className="field !w-auto">
          <option value="">Toutes les villes</option>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select name="paiement" defaultValue={paiement} className="field !w-auto">
          <option value="">Tous les paiements</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm">Filtrer</button>
      </form>

      {orders.length === 0 ? (
        <EmptyState icon="package" title="Aucune commande" message="Rien ne correspond à ces filtres." />
      ) : (
        <ResponsiveTable>
          <table className="table-lbd">
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Paiement Mobile Money</th>
                <th>Statut</th>
                <th className="!text-right">Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const phone = o.recipientPhone || o.buyer.phone;
                const wa = waLink(
                  phone,
                  `Bonjour ${o.buyer.firstName}, c'est Le Beau Défaut au sujet de votre commande ${o.reference} (${money(o.total)}).`
                );
                const awaitingProof = o.status === "EN_ATTENTE_PAIEMENT" && o.paymentStatus === "EN_ATTENTE";
                return (
                  <tr key={o.id} className={awaitingProof && o.paymentDeclaredAt ? "bg-[var(--color-gold-pale)]/25" : ""}>
                    <td>
                      <Link href={`/admin/commandes/${o.id}`} className="font-mono text-xs font-semibold hover:text-[var(--color-gold-dark)]">
                        {o.reference}
                      </Link>
                      <p className="text-[11px] text-[var(--color-ink-muted)] whitespace-nowrap">{dateTimeFR(o.createdAt)}</p>
                      {o._count.claims > 0 && (
                        <Badge tone="danger" className="mt-1">
                          {o._count.claims} réclamation{o._count.claims > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Link href={`/admin/utilisateurs/${o.buyer.id}`} className="whitespace-nowrap font-medium hover:text-[var(--color-gold-dark)]">
                        {o.buyer.firstName} {o.buyer.lastName}
                      </Link>
                      <p className="text-[11px] text-[var(--color-ink-muted)] whitespace-nowrap">
                        {phoneFR(phone)} · {o.quartier}
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">
                        {o.buyer._count.orders > 1 ? `Client fidèle · ${o.buyer._count.orders} commandes` : "1re commande"}
                      </p>
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" className="text-[11px] text-[var(--color-success)] underline inline-flex items-center gap-1">
                          <Icon name="phone" size={11} /> WhatsApp
                        </a>
                      )}
                    </td>
                    <td className="max-w-[240px]">
                      <div className="flex items-center gap-1.5">
                        {o.items.slice(0, 3).map((i) =>
                          i.imageSnapshot ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={i.id} src={i.imageSnapshot} alt="" className="h-9 w-9 rounded-md object-cover border border-[var(--color-sand)]" />
                          ) : null
                        )}
                      </div>
                      <p className="text-xs line-clamp-2 mt-1">{o.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(" · ")}</p>
                    </td>
                    <td>
                      <Badge tone={PAYMENT_STATUS[o.paymentStatus]?.tone ?? "neutral"}>{PAYMENT_STATUS[o.paymentStatus]?.label ?? o.paymentStatus}</Badge>
                      {awaitingProof && (
                        <p className="text-[11px] mt-1 whitespace-nowrap">
                          {o.paymentDeclaredAt ? (
                            <span className="text-[var(--color-gold-deep)] font-semibold">
                              Preuve reçue {relativeFR(o.paymentDeclaredAt)}
                              {o.paymentProofUrl ? " · capture" : ""}
                            </span>
                          ) : (
                            <span className="text-[var(--color-ink-muted)]">Pas encore de preuve</span>
                          )}
                        </p>
                      )}
                      {o.paymentRef && <p className="text-[11px] font-mono text-[var(--color-ink-muted)]">{o.paymentRef}</p>}
                    </td>
                    <td>
                      <Badge tone={ORDER_STATUS[o.status]?.tone ?? "neutral"}>{ORDER_STATUS[o.status]?.label ?? o.status}</Badge>
                      {o.delivery && o.status !== "EN_ATTENTE_PAIEMENT" && (
                        <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 whitespace-nowrap">
                          {DELIVERY_STATUS[o.delivery.status]?.label}
                          {o.delivery.courier ? ` · ${o.delivery.courier.user.firstName}` : ""}
                        </p>
                      )}
                    </td>
                    <td className="text-right font-semibold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {money(o.total)}
                    </td>
                    <td>
                      {awaitingProof ? (
                        <form action={confirmDepositAction}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <button className="btn btn-sm !bg-[var(--color-grade-a)] !text-white whitespace-nowrap" title="Paiement vérifié : confirmer la commande et prévenir le client">
                            <Icon name="check" size={13} /> Confirmer
                          </button>
                        </form>
                      ) : (
                        <Link href={`/admin/commandes/${o.id}`} className="btn btn-outline btn-sm whitespace-nowrap">
                          Ouvrir
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-[var(--color-ink-muted)]">
            Page {pageNum} / {pages}
          </span>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={qs({ page: String(pageNum - 1) })} className="btn btn-outline btn-sm">
                Précédente
              </Link>
            )}
            {pageNum < pages && (
              <Link href={qs({ page: String(pageNum + 1) })} className="btn btn-outline btn-sm">
                Suivante
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
