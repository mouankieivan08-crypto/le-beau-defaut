import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth";
import { money, dateTimeFR } from "@/lib/format";
import { ORDER_STATUS, DELIVERY_STATUS, paymentMethodLabel, CLAIM_STATUS, claimTypeLabel } from "@/lib/constants";
import { setOrderStatusAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, PageHeader, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Ventes" };

const TABS = [
  { key: "", label: "Toutes" },
  { key: "a-traiter", label: "À traiter" },
  { key: "en-cours", label: "En livraison" },
  { key: "livrees", label: "Livrées" },
  { key: "annulees", label: "Annulées" },
];

export default async function SellerSalesPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const user = await requireSeller("/vendeur/ventes");
  const { filtre = "" } = await searchParams;

  const statusIn: Record<string, string[]> = {
    "a-traiter": ["EN_ATTENTE_PAIEMENT", "PAYEE", "CONFIRMEE", "EN_PREPARATION"],
    "en-cours": ["EN_LIVRAISON"],
    livrees: ["LIVREE"],
    annulees: ["ANNULEE", "REMBOURSEE"],
  };

  const orders = await prisma.order.findMany({
    where: {
      items: { some: { sellerId: user.id } },
      ...(filtre ? { status: { in: statusIn[filtre] } } : {}),
    },
    include: {
      items: { where: { sellerId: user.id } },
      delivery: { include: { courier: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      claims: { select: { id: true, reference: true, status: true, type: true, adminNote: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <>
      <PageHeader title="Ventes" subtitle="Les commandes qui contiennent vos articles." />

      <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/vendeur/ventes?filtre=${t.key}` : "/vendeur/ventes"}
            className={`chip !text-xs !px-3 !py-1.5 ${
              filtre === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)]"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="package" title="Aucune vente ici" />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((o) => {
            const mine = o.items.reduce((s, i) => s + i.sellerAmount, 0);
            const gross = o.items.reduce((s, i) => s + i.lineTotal, 0);
            return (
              <li key={o.id} className="surface overflow-hidden">
                <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 bg-[var(--color-cream-deep)]/60 border-b border-[var(--color-sand)]">
                  <div className="flex items-center gap-4 flex-wrap text-xs text-[var(--color-ink-muted)]">
                    <span className="font-mono text-[var(--color-ink)] font-medium">{o.reference}</span>
                    <span>{dateTimeFR(o.createdAt)}</span>
                    <span>{paymentMethodLabel(o.paymentMethod)}</span>
                    <span>
                      {o.quartier}, {o.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                    {o.delivery && <Badge tone={DELIVERY_STATUS[o.delivery.status].tone}>{DELIVERY_STATUS[o.delivery.status].label}</Badge>}
                    {o.claims.map((c) => (
                      <Badge key={c.id} tone={CLAIM_STATUS[c.status].tone}>
                        <Icon name="alert" size={10} /> Réclamation · {CLAIM_STATUS[c.status].label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {o.claims.length > 0 && (
                  <div className="px-5 pt-4">
                    {o.claims.map((c) => (
                      <p key={c.id} className="text-xs text-[var(--color-danger)] flex gap-2">
                        <Icon name="alert" size={13} className="mt-0.5 shrink-0" />
                        <span>
                          <strong>{claimTypeLabel(c.type)}</strong> ({c.reference}) — notre équipe traite le dossier.
                          {c.adminNote ? ` ${c.adminNote}` : ""}
                        </span>
                      </p>
                    ))}
                  </div>
                )}

                <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-5 items-start">
                  <ul className="flex flex-col gap-3">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex items-center gap-3">
                        {it.imageSnapshot && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.imageSnapshot} alt="" className="h-14 w-14 rounded-lg object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {it.quantity}× {it.titleSnapshot}
                          </p>
                          <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5">
                            <GradeBadge grade={it.gradeSnapshot} size="sm" /> {it.defectSnapshot}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="md:text-right min-w-[200px]">
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      Vente {money(gross)} · commission {money(gross - mine)}
                    </p>
                    <p className="font-display text-xl font-bold">{money(mine)}</p>
                    <p className="text-[11px] text-[var(--color-ink-muted)]">
                      {o.status === "LIVREE" ? "Versement déclenché" : "Versé après livraison"}
                    </p>

                    <div className="flex md:justify-end gap-2 mt-3">
                      {["PAYEE", "EN_ATTENTE_PAIEMENT"].includes(o.status) && o.paymentStatus === "PAYE" && (
                        <StatusButton orderId={o.id} status="CONFIRMEE" label="Confirmer la disponibilité" />
                      )}
                      {o.status === "CONFIRMEE" && <StatusButton orderId={o.id} status="EN_PREPARATION" label="Article prêt" />}
                      {["PAYEE", "CONFIRMEE"].includes(o.status) && (
                        <form action={setOrderStatusAction}>
                          <input type="hidden" name="orderId" value={o.id} />
                          <input type="hidden" name="status" value="ANNULEE" />
                          <input type="hidden" name="note" value="Article indisponible chez le vendeur" />
                          <button className="btn btn-ghost btn-sm !text-[var(--color-danger)]">Indisponible</button>
                        </form>
                      )}
                    </div>
                    {o.delivery?.courier && (
                      <p className="text-[11px] text-[var(--color-ink-muted)] mt-2 flex md:justify-end items-center gap-1">
                        <Icon name="truck" size={12} /> Livreur : {o.delivery.courier.user.firstName}{" "}
                        {o.delivery.courier.user.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function StatusButton({ orderId, status, label }: { orderId: string; status: string; label: string }) {
  return (
    <form action={setOrderStatusAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <button className="btn btn-primary btn-sm">
        <Icon name="check" size={13} /> {label}
      </button>
    </form>
  );
}
