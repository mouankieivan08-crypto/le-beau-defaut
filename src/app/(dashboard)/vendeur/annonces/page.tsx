import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth";
import { money, relativeFR } from "@/lib/format";
import { PRODUCT_STATUS, AUTHENTICITY } from "@/lib/constants";
import { changeProductStatusAction, deleteProductAction } from "@/lib/actions/seller";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, PageHeader, EmptyState, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Mes annonces" };

const TABS = [
  { key: "", label: "Toutes" },
  { key: "PUBLIE", label: "En ligne" },
  { key: "EN_ATTENTE", label: "En validation" },
  { key: "REJETE", label: "À corriger" },
  { key: "BROUILLON", label: "Brouillons" },
  { key: "VENDU", label: "Vendues" },
  { key: "ARCHIVE", label: "Archivées" },
];

export default async function SellerListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; cree?: string }>;
}) {
  const user = await requireSeller("/vendeur/annonces");
  const { statut = "", cree } = await searchParams;

  const [products, counts] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId: user.id, ...(statut ? { status: statut } : {}) },
      include: {
        images: { where: { isCover: true }, take: 1 },
        category: { select: { name: true } },
        _count: { select: { favorites: true, orderItems: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.groupBy({ by: ["status"], where: { sellerId: user.id }, _count: true }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count])) as Record<string, number>;
  const total = counts.reduce((s, c) => s + c._count, 0);

  return (
    <>
      <PageHeader
        title="Mes annonces"
        subtitle={`${total} annonce(s) · ${countBy.PUBLIE ?? 0} en ligne`}
        action={
          <Link href="/vendeur/annonces/nouvelle" className="btn btn-gold">
            <Icon name="plus" size={15} /> Nouvelle annonce
          </Link>
        }
      />

      {cree && (
        <div className="mb-5">
          <Alert tone="success" title="Annonce enregistrée">
            Référence <strong className="font-mono">{cree}</strong>. Elle sera visible dès validation par notre équipe.
          </Alert>
        </div>
      )}

      <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/vendeur/annonces?statut=${t.key}` : "/vendeur/annonces"}
            className={`chip !text-xs !px-3 !py-1.5 ${
              statut === t.key
                ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)]"
            }`}
          >
            {t.label} <span className="opacity-60">{t.key ? countBy[t.key] ?? 0 : total}</span>
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon="tag"
          title="Aucune annonce ici"
          message="Un canapé rayé, un lot de chaises en fin de série, un sac à la doublure marquée : tout se vend quand le défaut est bien présenté."
          action={
            <Link href="/vendeur/annonces/nouvelle" className="btn btn-primary">
              Créer une annonce
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((p) => (
            <li key={p.id} className="surface p-4">
              <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                {p.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="h-24 w-24 rounded-xl object-cover shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-[var(--color-ink-muted)]">
                        {p.reference} · {p.category.name}
                      </p>
                      <h2 className="font-display font-semibold leading-snug line-clamp-1">{p.title}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge tone={PRODUCT_STATUS[p.status].tone}>{PRODUCT_STATUS[p.status].label}</Badge>
                      {p.vertical === "SACS" && p.authenticity !== "NON_APPLICABLE" && (
                        <Badge tone={AUTHENTICITY[p.authenticity].tone}>
                          <Icon name="shield" size={10} /> {AUTHENTICITY[p.authenticity].label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5 mt-1.5">
                    <GradeBadge grade={p.defectGrade} size="sm" /> <span className="line-clamp-1">{p.defectSummary}</span>
                  </p>

                  {p.status === "REJETE" && p.rejectionReason && (
                    <p className="text-xs text-[var(--color-danger)] mt-1.5 flex gap-1.5">
                      <Icon name="alert" size={12} className="mt-0.5 shrink-0" /> {p.rejectionReason}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
                    <p className="text-xs text-[var(--color-ink-muted)] flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-sm text-[var(--color-ink)] font-semibold">
                        {money(p.price)} <span className="text-[11px] font-normal text-[var(--color-ink-muted)]">−{p.discountPct} %</span>
                      </span>
                      <span>Stock {p.quantity}</span>
                      <span>
                        <Icon name="eye" size={11} className="inline -mt-0.5" /> {p.views}
                      </span>
                      <span>
                        <Icon name="heart" size={11} className="inline -mt-0.5" /> {p._count.favorites}
                      </span>
                      <span>{p.soldCount} vendu(s)</span>
                      <span>modifiée {relativeFR(p.updatedAt)}</span>
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.status === "PUBLIE" && (
                        <Link href={`/produit/${p.slug}`} className="btn btn-ghost btn-sm" target="_blank">
                          <Icon name="eye" size={13} /> Voir
                        </Link>
                      )}
                      {!["VENDU"].includes(p.status) && (
                        <Link href={`/vendeur/annonces/${p.id}`} className="btn btn-outline btn-sm">
                          <Icon name="edit" size={13} /> Modifier
                        </Link>
                      )}
                      {p.status === "BROUILLON" && (
                        <form action={changeProductStatusAction}>
                          <input type="hidden" name="productId" value={p.id} />
                          <input type="hidden" name="status" value="EN_ATTENTE" />
                          <button className="btn btn-primary btn-sm">Envoyer en validation</button>
                        </form>
                      )}
                      {p.status === "PUBLIE" && (
                        <form action={changeProductStatusAction}>
                          <input type="hidden" name="productId" value={p.id} />
                          <input type="hidden" name="status" value="ARCHIVE" />
                          <button className="btn btn-ghost btn-sm" title="Retirer de la vente">
                            Retirer
                          </button>
                        </form>
                      )}
                      {p.status === "ARCHIVE" && (
                        <form action={changeProductStatusAction}>
                          <input type="hidden" name="productId" value={p.id} />
                          <input type="hidden" name="status" value="EN_ATTENTE" />
                          <button className="btn btn-ghost btn-sm">Remettre en vente</button>
                        </form>
                      )}
                      {["BROUILLON", "REJETE", "ARCHIVE"].includes(p.status) && (
                        <form action={deleteProductAction}>
                          <input type="hidden" name="productId" value={p.id} />
                          <button
                            className="btn btn-ghost btn-sm !px-2 !text-[var(--color-danger)]"
                            aria-label={p._count.orderItems ? "Archiver" : "Supprimer"}
                            title={p._count.orderItems ? "Déjà vendue : sera archivée" : "Supprimer définitivement"}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
