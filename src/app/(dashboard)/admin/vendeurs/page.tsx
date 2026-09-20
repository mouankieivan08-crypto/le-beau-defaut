import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateFR, phoneFR } from "@/lib/format";
import { SELLER_STATUS } from "@/lib/constants";
import { setSellerStatusAction, setSellerCommissionAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, PageHeader, Avatar, Rating, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Vendeurs" };

const TYPE_LABEL: Record<string, string> = {
  ENTREPRISE: "Entreprise",
  PARTICULIER: "Particulier",
  DEPOT_VENTE: "Dépôt-vente",
};

export default async function AdminSellersPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await requireAdmin("/admin/vendeurs");
  const { statut = "" } = await searchParams;

  const sellers = await prisma.sellerProfile.findMany({
    where: statut ? { status: statut } : {},
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          _count: { select: { products: { where: { status: "PUBLIE" } } } },
        },
      },
      payouts: { where: { status: "EN_ATTENTE" }, select: { amount: true } },
    },
    orderBy: [{ status: "asc" }, { totalSales: "desc" }],
  });

  const counts = await prisma.sellerProfile.groupBy({ by: ["status"], _count: true });
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;

  return (
    <>
      <PageHeader
        title="Vendeurs"
        subtitle="Entreprises de mobilier, showrooms et dépôts-ventes partenaires."
      />

      <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar">
        {[
          { key: "", label: "Tous", n: counts.reduce((s, c) => s + c._count, 0) },
          { key: "EN_ATTENTE", label: "À activer", n: countBy.EN_ATTENTE ?? 0 },
          { key: "ACTIF", label: "Actifs", n: countBy.ACTIF ?? 0 },
          { key: "SUSPENDU", label: "Suspendus", n: countBy.SUSPENDU ?? 0 },
        ].map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/admin/vendeurs?statut=${t.key}` : "/admin/vendeurs"}
            className={`chip !text-xs !px-3 !py-1.5 ${
              statut === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)]"
            }`}
          >
            {t.label} <span className="opacity-60">{t.n}</span>
          </Link>
        ))}
      </div>

      {sellers.length === 0 ? (
        <EmptyState icon="home" title="Aucun vendeur" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sellers.map((s) => {
            const due = s.payouts.reduce((a, p) => a + p.amount, 0);
            return (
              <article key={s.id} className={`surface p-5 ${s.status === "EN_ATTENTE" ? "border-l-4 !border-l-[var(--color-gold)]" : ""}`}>
                <div className="flex items-start gap-3">
                  <Avatar first={s.shopName} last="" url={s.logoUrl} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h2 className="font-display text-lg font-bold leading-tight">{s.shopName}</h2>
                      <Badge tone={SELLER_STATUS[s.status].tone}>{SELLER_STATUS[s.status].label}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {TYPE_LABEL[s.type] ?? s.type} · {s.city} · depuis le {dateFR(s.createdAt)}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
                      {s.user.firstName} {s.user.lastName} · {s.user.email} · {phoneFR(s.contactPhone)}
                    </p>
                  </div>
                </div>

                {s.description && <p className="text-sm text-[var(--color-ink-soft)] mt-3 line-clamp-2">{s.description}</p>}

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
                  <Mini k="En ligne" v={String(s.user._count.products)} />
                  <Mini k="Ventes" v={money(s.totalSales, false)} />
                  <Mini k="À verser" v={money(due, false)} />
                  <div className="rounded-xl bg-[var(--color-cream-deep)]/60 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">Note</dt>
                    <dd className="mt-0.5 flex justify-center">
                      {s.ratingCount > 0 ? <Rating value={s.rating} size={11} /> : <span className="text-sm">—</span>}
                    </dd>
                  </div>
                </dl>

                <div className="text-[11px] text-[var(--color-ink-muted)] mt-3 flex flex-wrap gap-x-4 gap-y-1">
                  <span>RCCM : {s.rccm || <em className="text-[var(--color-danger)]">non fourni</em>}</span>
                  <span>NIU : {s.niu || <em className="text-[var(--color-danger)]">non fourni</em>}</span>
                  <span>
                    Versements : {s.mobileMoneyOp ?? "—"} {phoneFR(s.mobileMoney)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap mt-4 pt-4 border-t border-[var(--color-sand)]">
                  <form action={setSellerCommissionAction} className="flex items-center gap-2">
                    <input type="hidden" name="sellerId" value={s.id} />
                    <label className="text-xs text-[var(--color-ink-muted)]" htmlFor={`com-${s.id}`}>
                      Commission
                    </label>
                    <input
                      id={`com-${s.id}`}
                      name="commissionPct"
                      type="number"
                      min={0}
                      max={50}
                      defaultValue={s.commissionPct}
                      className="field !w-16 !py-1 text-center"
                    />
                    <span className="text-xs">%</span>
                    <button className="btn btn-ghost btn-sm">OK</button>
                  </form>

                  <div className="flex gap-2">
                    {s.status !== "ACTIF" && (
                      <form action={setSellerStatusAction}>
                        <input type="hidden" name="sellerId" value={s.id} />
                        <input type="hidden" name="status" value="ACTIF" />
                        <button className="btn btn-sm !bg-[var(--color-grade-a)] !text-white">
                          <Icon name="check" size={13} /> Activer
                        </button>
                      </form>
                    )}
                    {s.status === "ACTIF" && (
                      <form action={setSellerStatusAction}>
                        <input type="hidden" name="sellerId" value={s.id} />
                        <input type="hidden" name="status" value="SUSPENDU" />
                        <button className="btn btn-outline btn-sm !text-[var(--color-danger)]">Suspendre</button>
                      </form>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-[var(--color-cream-deep)]/60 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">{k}</dt>
      <dd className="text-sm font-semibold mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>
        {v}
      </dd>
    </div>
  );
}
