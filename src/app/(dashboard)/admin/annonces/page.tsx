import Link from "next/link";
import ResponsiveTable from "@/components/ResponsiveTable";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, relativeFR } from "@/lib/format";
import { PRODUCT_STATUS, VERTICAL_LIST, AUTHENTICITY, gradeOf } from "@/lib/constants";
import { approveProductAction, toggleProductFlagAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, PageHeader, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Annonces" };

const TABS = [
  { key: "EN_ATTENTE", label: "À valider" },
  { key: "AUTH", label: "Authentification" },
  { key: "PUBLIE", label: "Publiées" },
  { key: "REJETE", label: "Rejetées" },
  { key: "VENDU", label: "Vendues" },
  { key: "TOUT", label: "Toutes" },
];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; univers?: string; page?: string }>;
}) {
  await requireAdmin("/admin/annonces");
  const { statut = "EN_ATTENTE", q = "", univers = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const PER = 20;

  const where: Prisma.ProductWhereInput = {};
  if (statut === "AUTH") {
    where.vertical = "SACS";
    where.authenticity = { in: ["EN_COURS", "NON_VERIFIE"] };
    where.status = { in: ["EN_ATTENTE", "PUBLIE"] };
  } else if (statut !== "TOUT") {
    where.status = statut;
  }
  if (univers) where.vertical = univers;
  if (q) {
    where.OR = [{ title: { contains: q, mode: "insensitive" } }, { reference: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }];
  }

  const [products, total, counts, authCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { where: { isCover: true }, take: 1 },
        category: { select: { name: true } },
        seller: { select: { seller: { select: { shopName: true } } } },
        _count: { select: { defects: true, images: true } },
      },
      orderBy: statut === "EN_ATTENTE" ? { createdAt: "asc" } : { updatedAt: "desc" },
      skip: (pageNum - 1) * PER,
      take: PER,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ["status"], _count: true }),
    prisma.product.count({
      where: { vertical: "SACS", authenticity: { in: ["EN_COURS", "NON_VERIFIE"] }, status: { in: ["EN_ATTENTE", "PUBLIE"] } },
    }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const totalAll = counts.reduce((s, c) => s + c._count, 0);
  const pages = Math.max(1, Math.ceil(total / PER));

  const tabHref = (key: string) => {
    const sp = new URLSearchParams({ statut: key, ...(q ? { q } : {}), ...(univers ? { univers } : {}) });
    return `/admin/annonces?${sp}`;
  };

  return (
    <>
      <PageHeader
        title="Annonces"
        subtitle="Vérifiez que le défaut est photographié, décrit, et que la remise respecte la grille."
        action={
          <a href="/api/export/annonces" className="btn btn-outline btn-sm" download>
            <Icon name="download" size={14} /> Export Excel
          </a>
        }
      />

      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => {
          const n = t.key === "TOUT" ? totalAll : t.key === "AUTH" ? authCount : countBy[t.key] ?? 0;
          const active = statut === t.key;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              className={`chip !text-xs !px-3 !py-1.5 ${
                active
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)]"
              }`}
            >
              {t.label}
              <span className={active ? "opacity-70" : "text-[var(--color-ink-muted)]"}>{n}</span>
            </Link>
          );
        })}
      </div>

      <form className="flex flex-wrap gap-2 mb-5" action="/admin/annonces">
        <input type="hidden" name="statut" value={statut} />
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input name="q" defaultValue={q} placeholder="Titre, référence, marque…" className="field pl-8" />
          <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        </div>
        <select name="univers" defaultValue={univers} className="field !w-auto">
          <option value="">Tous les univers</option>
          {VERTICAL_LIST.map((v) => (
            <option key={v.key} value={v.key}>
              {v.label}
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm">Filtrer</button>
      </form>

      {products.length === 0 ? (
        <EmptyState
          icon="check-circle"
          title={statut === "EN_ATTENTE" ? "File de modération vide" : "Aucune annonce"}
          message={statut === "EN_ATTENTE" ? "Toutes les annonces ont été traitées." : undefined}
        />
      ) : (
        <ResponsiveTable>
          <table className="table-lbd">
            <thead>
              <tr>
                <th>Article</th>
                <th>Grade & défaut</th>
                <th className="!text-right">Prix</th>
                <th>Contrôles</th>
                <th>Statut</th>
                <th className="!text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const g = gradeOf(p.defectGrade);
                const discountOk = p.discountPct >= g.minDiscount;
                const hasDefectPhoto = p._count.images > 1;
                return (
                  <tr key={p.id}>
                    <td className="min-w-[260px]">
                      <div className="flex items-center gap-3">
                        {p.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/annonces/${p.id}`} className="font-medium hover:text-[var(--color-gold-dark)] line-clamp-1">
                            {p.title}
                          </Link>
                          <p className="text-[11px] text-[var(--color-ink-muted)]">
                            <span className="font-mono">{p.reference}</span> · {p.seller.seller?.shopName} · {relativeFR(p.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[240px]">
                      <div className="flex items-start gap-2">
                        <GradeBadge grade={p.defectGrade} size="sm" />
                        <span className="text-xs text-[var(--color-ink-muted)] line-clamp-2">{p.defectSummary}</span>
                      </div>
                    </td>
                    <td className="text-right whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                      <p className="font-semibold">{money(p.price)}</p>
                      <p className="text-[11px] text-[var(--color-ink-muted)]">−{p.discountPct} %</p>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-[11px]">
                        <Check ok={discountOk} label={discountOk ? `Remise ≥ ${g.minDiscount} %` : `Remise < ${g.minDiscount} %`} />
                        <Check ok={p._count.defects > 0} label={`${p._count.defects} défaut(s) décrit(s)`} />
                        <Check ok={hasDefectPhoto} label={`${p._count.images} photo(s)`} />
                        {p.vertical === "SACS" && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="shield" size={11} className="text-[var(--color-ink-muted)]" />
                            {AUTHENTICITY[p.authenticity].label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={PRODUCT_STATUS[p.status].tone}>{PRODUCT_STATUS[p.status].label}</Badge>
                        {p.isFeatured && <Badge tone="warning">Coup de cœur</Badge>}
                        {p.isFlashDeal && <Badge tone="danger">Bonne affaire</Badge>}
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.status === "EN_ATTENTE" && (
                          <form action={approveProductAction}>
                            <input type="hidden" name="productId" value={p.id} />
                            <button
                              className="btn btn-sm !bg-[var(--color-grade-a)] !text-white"
                              disabled={!discountOk}
                              title={discountOk ? "Publier" : "Remise insuffisante pour ce grade"}
                            >
                              <Icon name="check" size={13} /> Publier
                            </button>
                          </form>
                        )}
                        {p.status === "PUBLIE" && (
                          <>
                            <form action={toggleProductFlagAction}>
                              <input type="hidden" name="productId" value={p.id} />
                              <input type="hidden" name="flag" value="isFeatured" />
                              <button
                                className={`btn btn-sm !px-2 ${p.isFeatured ? "btn-gold" : "btn-outline"}`}
                                title={p.isFeatured ? "Retirer des coups de cœur" : "Mettre en coup de cœur"}
                                aria-label="Coup de cœur"
                              >
                                <Icon name="star" size={13} />
                              </button>
                            </form>
                            <form action={toggleProductFlagAction}>
                              <input type="hidden" name="productId" value={p.id} />
                              <input type="hidden" name="flag" value="isFlashDeal" />
                              <button
                                className={`btn btn-sm !px-2 ${p.isFlashDeal ? "btn-danger" : "btn-outline"}`}
                                title={p.isFlashDeal ? "Retirer des bonnes affaires" : "Marquer bonne affaire"}
                                aria-label="Bonne affaire"
                              >
                                <Icon name="sparkle" size={13} />
                              </button>
                            </form>
                          </>
                        )}
                        <Link href={`/admin/annonces/${p.id}`} className="btn btn-outline btn-sm">
                          Examiner
                        </Link>
                      </div>
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
            Page {pageNum} sur {pages} · {total} annonces
          </span>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={`${tabHref(statut)}&page=${pageNum - 1}`} className="btn btn-outline btn-sm">
                Précédente
              </Link>
            )}
            {pageNum < pages && (
              <Link href={`${tabHref(statut)}&page=${pageNum + 1}`} className="btn btn-outline btn-sm">
                Suivante
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1" style={{ color: ok ? "var(--color-success)" : "var(--color-danger)" }}>
      <Icon name={ok ? "check" : "alert"} size={11} />
      <span className="text-[var(--color-ink-soft)]">{label}</span>
    </span>
  );
}
