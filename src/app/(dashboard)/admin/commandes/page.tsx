import Link from "next/link";
import ResponsiveTable from "@/components/ResponsiveTable";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateTimeFR } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS, DELIVERY_STATUS, paymentMethodLabel, CITIES } from "@/lib/constants";
import Icon from "@/components/Icon";
import { Badge, PageHeader, EmptyState, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Commandes" };

const TABS = [
  { key: "", label: "Toutes" },
  { key: "EN_ATTENTE_PAIEMENT", label: "Paiement en attente" },
  { key: "CONFIRMEE", label: "À préparer" },
  { key: "EN_LIVRAISON", label: "En livraison" },
  { key: "LIVREE", label: "Livrées" },
  { key: "ANNULEE", label: "Annulées" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; ville?: string; paiement?: string; page?: string }>;
}) {
  await requireAdmin("/admin/commandes");
  const { statut = "", q = "", ville = "", paiement = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const PER = 25;

  const where: Prisma.OrderWhereInput = {};
  if (statut === "CONFIRMEE") where.status = { in: ["PAYEE", "CONFIRMEE", "EN_PREPARATION"] };
  else if (statut) where.status = statut;
  if (ville) where.city = ville;
  if (paiement) where.paymentMethod = paiement;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { recipientName: { contains: q, mode: "insensitive" } },
      { recipientPhone: { contains: q, mode: "insensitive" } },
      { buyer: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [orders, total, counts, sums] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        buyer: { select: { firstName: true, lastName: true, email: true } },
        items: { select: { id: true, titleSnapshot: true, quantity: true } },
        delivery: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PER,
      take: PER,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
    prisma.order.aggregate({ where: { ...where, status: { notIn: ["ANNULEE", "REMBOURSEE"] } }, _sum: { total: true, deliveryFee: true } }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const pages = Math.max(1, Math.ceil(total / PER));
  const tabCount = (key: string) =>
    key === ""
      ? counts.reduce((s, c) => s + c._count, 0)
      : key === "CONFIRMEE"
        ? (countBy.PAYEE ?? 0) + (countBy.CONFIRMEE ?? 0) + (countBy.EN_PREPARATION ?? 0)
        : countBy[key] ?? 0;

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
        subtitle="Suivi des paiements, de la préparation et des livraisons."
        action={
          <a href="/api/export/commandes" className="btn btn-outline btn-sm" download>
            <Icon name="download" size={14} /> Export Excel
          </a>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <Stat label="Commandes (filtre)" value={total} icon="package" />
        <Stat label="Montant encaissé ou à encaisser" value={money(sums._sum.total ?? 0)} icon="wallet" tone="gold" />
        <Stat label="Frais de livraison" value={money(sums._sum.deliveryFee ?? 0)} icon="truck" />
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={qs({ statut: t.key, page: "" })}
            className={`chip !text-xs !px-3 !py-1.5 ${
              statut === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)]"
            }`}
          >
            {t.label} <span className="opacity-60">{tabCount(t.key)}</span>
          </Link>
        ))}
      </div>

      <form action="/admin/commandes" className="flex flex-wrap gap-2 mb-5">
        <input type="hidden" name="statut" value={statut} />
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input name="q" defaultValue={q} placeholder="Référence, nom, téléphone, e-mail…" className="field pl-8" />
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
          {["MOBILE_MONEY_MTN", "MOBILE_MONEY_AIRTEL", "ESPECES_LIVRAISON", "VIREMENT"].map((p) => (
            <option key={p} value={p}>
              {paymentMethodLabel(p)}
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm">Filtrer</button>
      </form>

      {orders.length === 0 ? (
        <EmptyState icon="package" title="Aucune commande" />
      ) : (
        <ResponsiveTable>
          <table className="table-lbd">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Paiement</th>
                <th>Commande</th>
                <th>Livraison</th>
                <th className="!text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/commandes/${o.id}`} className="font-mono text-xs font-medium hover:text-[var(--color-gold-dark)]">
                      {o.reference}
                    </Link>
                    <p className="text-[11px] text-[var(--color-ink-muted)] whitespace-nowrap">{dateTimeFR(o.createdAt)}</p>
                  </td>
                  <td>
                    <p className="whitespace-nowrap">{o.recipientName}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {o.quartier}, {o.city}
                    </p>
                  </td>
                  <td className="max-w-[220px]">
                    <p className="text-xs line-clamp-2">{o.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(" · ")}</p>
                  </td>
                  <td>
                    <p className="text-xs whitespace-nowrap">{paymentMethodLabel(o.paymentMethod)}</p>
                    <Badge tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</Badge>
                  </td>
                  <td>
                    <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                  </td>
                  <td>
                    {o.delivery && <Badge tone={DELIVERY_STATUS[o.delivery.status].tone}>{DELIVERY_STATUS[o.delivery.status].label}</Badge>}
                  </td>
                  <td className="text-right font-semibold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {money(o.total)}
                  </td>
                </tr>
              ))}
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
