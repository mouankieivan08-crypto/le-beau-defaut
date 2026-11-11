import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireClientSpace } from "@/lib/auth";
import { money, dateFR } from "@/lib/format";
import { ORDER_STATUS, paymentMethodLabel } from "@/lib/constants";
import { AccountLayout } from "@/components/AccountNav";
import Icon from "@/components/Icon";
import { Badge, EmptyState, GradeBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Mes commandes" };

const FILTERS = [
  { key: "", label: "Toutes" },
  { key: "en-cours", label: "En cours" },
  { key: "livrees", label: "Livrées" },
  { key: "annulees", label: "Annulées" },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const user = await requireClientSpace("/compte/commandes", "/admin/commandes");
  const { filtre = "" } = await searchParams;

  const statusFilter =
    filtre === "en-cours"
      ? { notIn: ["LIVREE", "ANNULEE", "REMBOURSEE"] }
      : filtre === "livrees"
        ? { equals: "LIVREE" }
        : filtre === "annulees"
          ? { in: ["ANNULEE", "REMBOURSEE"] }
          : undefined;

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id, ...(statusFilter ? { status: statusFilter } : {}) },
    include: { items: true, delivery: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountLayout active="/compte/commandes" user={user}>
      <h1 className="font-display text-[28px] font-bold mb-5">Mes commandes</h1>

      <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key ? `/compte/commandes?filtre=${f.key}` : "/compte/commandes"}
            className={`chip !text-xs !px-3 !py-1.5 ${
              filtre === f.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-cream-deep)] text-[var(--color-ink-soft)] hover:bg-[var(--color-sand)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="package"
          title="Aucune commande ici"
          action={
            <Link href="/catalogue" className="btn btn-primary">
              Voir le catalogue
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((o) => {
            const st = ORDER_STATUS[o.status];
            return (
              <li key={o.id} className="surface overflow-hidden">
                <div className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 bg-[var(--color-cream-deep)]/60 border-b border-[var(--color-sand)]">
                  <div className="flex items-center gap-4 flex-wrap text-xs text-[var(--color-ink-muted)]">
                    <span>
                      <span className="block uppercase tracking-wide text-[10px]">Commande</span>
                      <span className="font-mono text-[var(--color-ink)]">{o.reference}</span>
                    </span>
                    <span>
                      <span className="block uppercase tracking-wide text-[10px]">Date</span>
                      <span className="text-[var(--color-ink)]">{dateFR(o.createdAt)}</span>
                    </span>
                    <span>
                      <span className="block uppercase tracking-wide text-[10px]">Total</span>
                      <span className="text-[var(--color-ink)] font-semibold">{money(o.total)}</span>
                    </span>
                    <span className="hidden sm:block">
                      <span className="block uppercase tracking-wide text-[10px]">Paiement</span>
                      <span className="text-[var(--color-ink)]">{paymentMethodLabel(o.paymentMethod)}</span>
                    </span>
                  </div>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>

                <div className="p-5 flex flex-col gap-3">
                  {o.items.map((it) => (
                    <div key={it.id} className="flex gap-3.5 items-center">
                      {it.imageSnapshot && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.imageSnapshot} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium line-clamp-1">{it.titleSnapshot}</p>
                        <p className="text-xs text-[var(--color-ink-muted)] line-clamp-1 flex items-center gap-1.5 mt-0.5">
                          <GradeBadge grade={it.gradeSnapshot} size="sm" /> {it.defectSnapshot}
                        </p>
                      </div>
                      <p className="text-sm whitespace-nowrap">
                        {it.quantity} × {money(it.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-4 flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5">
                    <Icon name="pin" size={12} /> {o.quartier}, {o.city}
                    {o.delivery && (
                      <>
                        {" "}
                        · suivi <span className="font-mono">{o.delivery.trackingCode}</span>
                      </>
                    )}
                  </p>
                  <Link href={`/compte/commandes/${o.id}`} className="btn btn-outline btn-sm">
                    Détails et suivi <Icon name="chevron-right" size={13} />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccountLayout>
  );
}
