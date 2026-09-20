import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { searchProducts, facets, favoriteIds, SORT_LABELS, type CatalogueParams } from '@/lib/queries';
import { GRADE_LIST, VERTICAL_LIST, CITIES } from '@/lib/constants';
import ProductCard, { ProductGrid } from '@/components/ProductCard';
import Icon from '@/components/Icon';
import { EmptyState, GradeBadge, Breadcrumb } from '@/components/ui';

export default async function CatalogueView({
  params,
  basePath = "/catalogue",
  heading,
  intro,
}: {
  params: CatalogueParams;
  basePath?: string;
  heading?: string;
  intro?: string;
}) {
  const user = await getCurrentUser();
  const [{ items, total, page, pages }, f, categories] = await Promise.all([
    searchProducts(params),
    facets(params),
    prisma.category.findMany({
      where: { isActive: true, ...(params.vertical ? { vertical: params.vertical } : {}) },
      orderBy: [{ vertical: "asc" }, { position: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, vertical: true, _count: { select: { products: true } } },
    }),
  ]);
  const favs = await favoriteIds(user?.id);

  const vert = params.vertical ? VERTICAL_LIST.find((v) => v.key === params.vertical) : null;
  const title = heading ?? vert?.label ?? "Tout le catalogue";
  const subtitle = intro ?? vert?.tagline ?? "Mobilier, sacs de luxe et fourre-tout — le défaut annoncé, le prix ajusté.";

  /** Construit une URL en conservant les filtres actifs. */
  const url = (patch: Partial<CatalogueParams>) => {
    const next = { ...params, ...patch };
    if (basePath !== "/catalogue") delete next.vertical;
    delete next.page;
    const qs = new URLSearchParams(
      Object.entries(next).filter(([, v]) => v != null && v !== "") as [string, string][]
    ).toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const activeFilters = [
    params.q && { label: `« ${params.q} »`, href: url({ q: "" }) },
    params.grade && { label: `Grade ${params.grade}`, href: url({ grade: "" }) },
    params.ville && { label: params.ville, href: url({ ville: "" }) },
    params.categorie && {
      label: categories.find((c) => c.slug === params.categorie)?.name ?? params.categorie,
      href: url({ categorie: "" }),
    },
    params.prixMax && { label: `≤ ${params.prixMax} F`, href: url({ prixMin: "", prixMax: "" }) },
    params.remiseMin && { label: `Remise ≥ ${params.remiseMin} %`, href: url({ remiseMin: "" }) },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          ...(vert ? [{ label: "Catalogue", href: "/catalogue" }, { label: vert.label }] : [{ label: "Catalogue" }]),
        ]}
      />

      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="font-display text-[32px] font-bold leading-tight">{title}</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-2xl">{subtitle}</p>
        </div>
        <p className="text-sm text-[var(--color-ink-muted)]">
          <strong className="text-[var(--color-ink)] font-display text-base">{total}</strong> article
          {total > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[264px_1fr] gap-7 items-start">
        {/* ---------------- Filtres ---------------- */}
        <aside className="surface p-5 lg:sticky lg:top-[136px]">
          <form action={basePath} className="flex flex-col gap-5">
            {params.vertical && basePath === "/catalogue" && (
              <input type="hidden" name="vertical" value={params.vertical} />
            )}
            {params.tri && <input type="hidden" name="tri" value={params.tri} />}

            <div>
              <label className="label" htmlFor="q">
                Rechercher
              </label>
              <div className="relative">
                <input
                  id="q"
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="Canapé, Louis Vuitton…"
                  className="field pl-8"
                />
                <Icon
                  name="search"
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
                />
              </div>
            </div>

            {basePath === "/catalogue" && (
              <FilterBlock title="Univers">
                <div className="flex flex-col gap-1">
                  <FilterRadio name="vertical" value="" label="Tous" checked={!params.vertical} />
                  {VERTICAL_LIST.map((v) => (
                    <FilterRadio
                      key={v.key}
                      name="vertical"
                      value={v.key}
                      label={v.label}
                      checked={params.vertical === v.key}
                    />
                  ))}
                </div>
              </FilterBlock>
            )}

            <FilterBlock title="Grade du défaut">
              <div className="flex flex-col gap-1.5">
                <FilterRadio name="grade" value="" label="Tous les grades" checked={!params.grade} />
                {GRADE_LIST.map((g) => (
                  <label
                    key={g.key}
                    className="flex items-center gap-2.5 cursor-pointer py-0.5 group"
                    title={g.description}
                  >
                    <input
                      type="radio"
                      name="grade"
                      value={g.key}
                      defaultChecked={params.grade === g.key}
                      className="accent-[var(--color-gold)]"
                    />
                    <GradeBadge grade={g.key} size="sm" />
                    <span className="text-sm group-hover:text-[var(--color-gold-dark)] transition-colors flex-1">
                      {g.name}
                    </span>
                    <span className="text-[11px] text-[var(--color-ink-muted)]">{f.grades[g.key] ?? 0}</span>
                  </label>
                ))}
              </div>
            </FilterBlock>

            {categories.length > 0 && (
              <FilterBlock title="Catégorie">
                <select name="categorie" defaultValue={params.categorie ?? ""} className="field">
                  <option value="">Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c._count.products})
                    </option>
                  ))}
                </select>
              </FilterBlock>
            )}

            <FilterBlock title="Budget (FCFA)">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="prixMin"
                  min={0}
                  step={1000}
                  defaultValue={params.prixMin ?? ""}
                  placeholder="Min"
                  className="field"
                />
                <span className="text-[var(--color-ink-muted)] text-xs">à</span>
                <input
                  type="number"
                  name="prixMax"
                  min={0}
                  step={1000}
                  defaultValue={params.prixMax ?? ""}
                  placeholder="Max"
                  className="field"
                />
              </div>
            </FilterBlock>

            <FilterBlock title="Remise minimale">
              <select name="remiseMin" defaultValue={params.remiseMin ?? ""} className="field">
                <option value="">Peu importe</option>
                {[20, 30, 40, 50, 60].map((r) => (
                  <option key={r} value={r}>
                    Au moins −{r} %
                  </option>
                ))}
              </select>
            </FilterBlock>

            <FilterBlock title="Ville">
              <select name="ville" defaultValue={params.ville ?? ""} className="field">
                <option value="">Toutes les villes</option>
                {(f.cities.length ? f.cities.map((c) => c.city) : [...CITIES]).map((c) => (
                  <option key={c} value={c}>
                    {c}
                    {f.cities.find((x) => x.city === c) ? ` (${f.cities.find((x) => x.city === c)!.count})` : ""}
                  </option>
                ))}
              </select>
            </FilterBlock>

            <div className="flex gap-2 pt-1">
              <button className="btn btn-primary flex-1">
                <Icon name="filter" size={14} /> Filtrer
              </button>
              <Link href={basePath} className="btn btn-ghost" title="Réinitialiser">
                <Icon name="refresh" size={15} />
              </Link>
            </div>
          </form>
        </aside>

        {/* ---------------- Résultats ---------------- */}
        <div>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((af) => (
                <Link key={af.label} href={af.href} className="chip bg-[var(--color-ink)] text-[var(--color-cream)]">
                  {af.label} <Icon name="close" size={11} />
                </Link>
              ))}
              {activeFilters.length > 1 && (
                <Link href={basePath} className="text-xs text-[var(--color-ink-muted)] underline hover:text-[var(--color-ink)]">
                  Tout effacer
                </Link>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-auto min-w-0 max-w-full">
              <span className="text-xs text-[var(--color-ink-muted)]">Trier :</span>
              <div className="flex gap-1 overflow-x-auto no-scrollbar min-w-0">
                {Object.entries(SORT_LABELS).map(([key, label]) => (
                  <Link
                    key={key}
                    href={url({ tri: key })}
                    className={`chip transition-colors ${
                      (params.tri ?? "recent") === key
                        ? "bg-[var(--color-gold)] text-white"
                        : "bg-[var(--color-cream-deep)] text-[var(--color-ink-soft)] hover:bg-[var(--color-sand)]"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon="search"
              title="Aucun article ne correspond"
              message="Élargissez le budget, changez de grade ou retirez un filtre — le stock bouge tous les jours."
              action={
                <Link href={basePath} className="btn btn-outline">
                  Réinitialiser les filtres
                </Link>
              }
            />
          ) : (
            <>
              <ProductGrid cols={3}>
                {items.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    isFavorite={favs.has(p.id)}
                    revalidate={basePath}
                  />
                ))}
              </ProductGrid>

              {pages > 1 && (
                <nav className="flex items-center justify-center gap-1.5 mt-10">
                  {page > 1 && (
                    <Link href={pageUrl(basePath, params, page - 1)} className="btn btn-outline btn-sm">
                      <Icon name="chevron-left" size={14} /> Précédent
                    </Link>
                  )}
                  {Array.from({ length: pages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2)
                    .map((n, idx, arr) => (
                      <span key={n} className="flex items-center gap-1.5">
                        {idx > 0 && arr[idx - 1] !== n - 1 && (
                          <span className="text-[var(--color-ink-muted)] px-1">…</span>
                        )}
                        <Link
                          href={pageUrl(basePath, params, n)}
                          className={`btn btn-sm !px-3 ${n === page ? "btn-primary" : "btn-ghost"}`}
                        >
                          {n}
                        </Link>
                      </span>
                    ))}
                  {page < pages && (
                    <Link href={pageUrl(basePath, params, page + 1)} className="btn btn-outline btn-sm">
                      Suivant <Icon name="chevron-right" size={14} />
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function pageUrl(basePath: string, params: CatalogueParams, page: number) {
  const next = { ...params, page: String(page) };
  if (basePath !== "/catalogue") delete next.vertical;
  const qs = new URLSearchParams(
    Object.entries(next).filter(([, v]) => v != null && v !== "") as [string, string][]
  ).toString();
  return `${basePath}?${qs}`;
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label">{title}</p>
      {children}
    </div>
  );
}

function FilterRadio({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-0.5 text-sm hover:text-[var(--color-gold-dark)] transition-colors">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="accent-[var(--color-gold)]" />
      {label}
    </label>
  );
}

