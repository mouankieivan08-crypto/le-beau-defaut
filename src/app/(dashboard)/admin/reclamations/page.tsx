import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateTimeFR, relativeFR, phoneFR } from "@/lib/format";
import { CLAIM_STATUS, claimTypeLabel, claimResolutionLabel } from "@/lib/constants";
import ClaimDecision from "@/components/ClaimDecision";
import Icon from "@/components/Icon";
import { Badge, PageHeader, Stat, EmptyState, GradeBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Réclamations" };

const TABS = [
  { key: "A_TRAITER", label: "À traiter" },
  { key: "ACCEPTEE", label: "Acceptées" },
  { key: "REFUSEE", label: "Refusées" },
  { key: "TOUT", label: "Toutes" },
];

export default async function AdminClaimsPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin("/admin/reclamations");
  const { statut = "A_TRAITER" } = await searchParams;

  const where =
    statut === "A_TRAITER" ? { status: { in: ["OUVERTE", "EN_EXAMEN"] } } : statut === "TOUT" ? {} : { status: statut };

  const [claims, counts, refunded, deliveredCount] = await Promise.all([
    prisma.claim.findMany({
      where,
      include: {
        buyer: { select: { firstName: true, lastName: true, phone: true, email: true } },
        orderItem: { select: { titleSnapshot: true, gradeSnapshot: true, defectSnapshot: true, imageSnapshot: true, sellerId: true } },
        order: {
          select: {
            id: true,
            reference: true,
            total: true,
            deliveredAt: true,
            items: { select: { titleSnapshot: true, sellerId: true } },
          },
        },
        handledBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.claim.groupBy({ by: ["status"], _count: true }),
    prisma.claim.aggregate({ where: { status: "ACCEPTEE" }, _sum: { refundAmount: true } }),
    prisma.order.count({ where: { status: { in: ["LIVREE", "REMBOURSEE"] } } }),
  ]);

  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const total = counts.reduce((s, c) => s + c._count, 0);
  const rate = deliveredCount ? ((total / deliveredCount) * 100).toFixed(1).replace(".", ",") : "0";


  const tabCount = (key: string) =>
    key === "TOUT" ? total : key === "A_TRAITER" ? (countBy.OUVERTE ?? 0) + (countBy.EN_EXAMEN ?? 0) : countBy[key] ?? 0;

  return (
    <>
      <PageHeader
        title="Réclamations"
        subtitle="La garantie de la maison : si le défaut annoncé ne correspond pas, l'article est repris."
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <Stat
          label="À traiter"
          value={tabCount("A_TRAITER")}
          icon="alert"
          tone={tabCount("A_TRAITER") > 0 ? "danger" : "success"}
        />
        <Stat label="Taux de réclamation" value={`${rate} %`} hint={`${total} sur ${deliveredCount} commandes livrées`} icon="chart" />
        <Stat label="Acceptées" value={countBy.ACCEPTEE ?? 0} icon="check-circle" tone="success" />
        <Stat label="Remboursé" value={money(refunded._sum.refundAmount ?? 0)} icon="wallet" tone="gold" />
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reclamations?statut=${t.key}`}
            className={`chip !text-xs !px-3 !py-1.5 ${
              statut === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)]"
            }`}
          >
            {t.label} <span className="opacity-60">{tabCount(t.key)}</span>
          </Link>
        ))}
      </div>

      {claims.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title={statut === "A_TRAITER" ? "Aucune réclamation en attente" : "Aucune réclamation"}
          message="Bon signe : les défauts annoncés correspondent à ce que reçoivent les acheteurs."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {claims.map((c) => {
            const open = ["OUVERTE", "EN_EXAMEN"].includes(c.status);
            return (
              <li key={c.id} className={`surface p-5 ${open ? "border-l-4 !border-l-[var(--color-danger)]" : ""}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-[var(--color-ink-muted)]">{c.reference}</span>
                      <Badge tone={CLAIM_STATUS[c.status].tone}>{CLAIM_STATUS[c.status].label}</Badge>
                      <span className="text-xs text-[var(--color-ink-muted)]">{relativeFR(c.createdAt)}</span>
                    </div>
                    <h2 className="font-display text-lg font-bold mt-1">{claimTypeLabel(c.type)}</h2>
                  </div>
                  <div className="text-right text-xs text-[var(--color-ink-muted)]">
                    <Link href={`/admin/commandes/${c.order.id}`} className="font-mono hover:text-[var(--color-gold-dark)]">
                      {c.order.reference}
                    </Link>
                    <p>{money(c.order.total)}</p>
                    <p>livrée le {c.order.deliveredAt ? dateTimeFR(c.order.deliveredAt).split(",")[0] : "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
                  {c.photoUrl && (
                    <a href={c.photoUrl} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.photoUrl} alt="Photo de la réclamation" className="h-28 w-28 rounded-xl object-cover" />
                    </a>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{c.description}</p>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-[var(--color-ink-muted)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="user" size={12} /> {c.buyer.firstName} {c.buyer.lastName}
                      </span>
                      <a href={`tel:${c.buyer.phone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-ink)]">
                        <Icon name="phone" size={12} /> {phoneFR(c.buyer.phone)}
                      </a>

                    </div>

                    {c.orderItem && (
                      <div className="flex items-center gap-2.5 mt-3 p-2.5 rounded-xl bg-[var(--color-cream-deep)]/60">
                        {c.orderItem.imageSnapshot && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.orderItem.imageSnapshot} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{c.orderItem.titleSnapshot}</p>
                          <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5">
                            <GradeBadge grade={c.orderItem.gradeSnapshot} size="sm" />
                            <span className="line-clamp-1">Annoncé : {c.orderItem.defectSnapshot}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {open ? (
                  <ClaimDecision claimId={c.id} orderTotal={c.order.total} currentStatus={c.status} />
                ) : (
                  <p className="text-xs text-[var(--color-ink-muted)] border-t border-[var(--color-sand)] mt-4 pt-3">
                    {c.status === "ACCEPTEE" ? claimResolutionLabel(c.resolution) : "Refusée"}
                    {c.refundAmount > 0 ? ` · ${money(c.refundAmount)} remboursés` : ""}
                    {c.handledBy ? ` · par ${c.handledBy.firstName} ${c.handledBy.lastName}` : ""}
                    {c.handledAt ? ` le ${dateTimeFR(c.handledAt)}` : ""}
                    {c.adminNote ? ` — « ${c.adminNote} »` : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
