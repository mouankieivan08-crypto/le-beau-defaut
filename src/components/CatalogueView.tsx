import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { searchProducts, facets, favoriteIds, SORT_LABELS, type CatalogueParams } from '@/lib/queries';
import { GRADE_LIST, VERTICAL_LIST, CITIES } from '@/lib/constants';
import ProductCard, { ProductGrid } from '@/components/ProductCard';
import Icon from '@/components/Icon';
import FilterDrawer from '@/components/FilterDrawer';
import { EmptyState, GradeBadge, Breadcrumb } from '@/components/ui';

/** Tranches de prix proposées d'un clic, calées sur les prix congolais. */
const PRICE_STEPS = [
  { label: "< 25 k", min: "", max: "25000" },
  { label: "25–75 k", min: "25000", max: "75000" },
  { label: "75–200 k", min: "75000", max: "200000" },
  { label: "200–500 k", min: "200000", max: "500000" },
  { label: "> 500 k", min: "500000", max: "" },
];

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
  const catalog = await searchProducts(params);
  const f = await facets(params);
  const categories = await prisma.category.findMany({
    where: { isActive: true, vertical: "MOBILIER" },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, vertical: true, _count: { select: { products: true } } },
  });
  const { items, total, page, pages } = catalog;
  const favs = await favoriteIds(user?.id);

  const vert = params.vertical ? VERTICAL_LIST.find((v) => v.key === params.vertical) : null;
  const title = heading ?? vert?.label ?? "Tout le catalogue";
  const subtitle = intro ?? vert?.tagline ?? "Mobilier à petit défaut — le défaut annoncé, le prix ajusté.";

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
    params.circuit && {
      label: params.circuit === "MAISON" ? "Vendu par Le Beau Défaut" : "Entre particuliers",
      href: url({ circuit: "" }),
    },
    params.grade && { label: `Grade ${params.grade}`, href: url({ grade: "" }) },
    params.categorie && {
      label: categories.find((c) => c.slug === params.categorie)?.name ?? params.categorie,
      href: url({ categorie: "" }),
    },
    params.marque && { label: params.marque, href: url({ marque: "" }) },
    params.quartier && { label: params.quartier, href: url({ quartier: "" }) },
    params.ville && { label: params.ville, href: url({ ville: "" }) },
    (params.prixMin || params.prixMax) && {
      label:
        params.prixMin && params.prixMax
          ? `${params.prixMin} – ${params.prixMax} F`
          : params.prixMax
            ? `≤ ${params.prixMax} F`
            : `≥ ${params.prixMin} F`,
      href: url({ prixMin: "", prixMax: "" }),
    },
    params.remiseMin && { label: `Remise ≥ ${params.remiseMin} %`, href: url({ remiseMin: "" }) },
    params.authentifie === "1" && { label: "Authentifié LBD", href: url({ authentifie: "" }) },
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
        <FilterDrawer count={activeFilters.length}>
          <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--color-sand)]">
            <p className="font-display text-base font-bold flex items-center gap-2">
              <Icon name="filter" size={15} className="text-[var(--color-gold-dark)]" />
              Filtrer
              {activeFilters.length > 0 && (
                <span className="h-5 min-w-5 px-1.5 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] text-[10px] font-bold grid place-items-center">
                  {activeFilters.length}
                </span>
              )}
            </p>
            {activeFilters.length > 0 && (
              <Link href={basePath} className="text-xs text-[var(--color-ink-muted)] underline hover:text-[var(--color-ink)]">
                Tout effacer
              </Link>
            )}
          </div>

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
                  placeholder="Canapé, Louis Vuitton, frigo…"
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
                      count={f.verticals[v.key]}
                      checked={params.vertical === v.key}
                    />
                  ))}
                </div>
              </FilterBlock>
            )}

            <FilterBlock title="Notre stock">
              <div className="flex flex-col gap-1">
                <FilterRadio name="circuit" value="" label="Peu importe" checked={!params.circuit} />
                <FilterRadio
                  name="circuit"
                  value="MAISON"
                  label="Le Beau Défaut"
                  hint="Notre stock, notre garantie"
                  count={f.circuits.MAISON}
                  checked={params.circuit === "MAISON"}
                />
              </div>
            </FilterBlock>

            <FilterBlock title="Le défaut">
              <div className="flex flex-col gap-1">
                <FilterRadio name="grade" value="" label="Tous les grades" checked={!params.grade} />
                {GRADE_LIST.map((g) => (
                  <label key={g.key} className="flex items-start gap-2.5 cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--color-cream-deep)] has-[:checked]:bg-[var(--color-gold-pale)] has-[:checked]:font-semibold has-[:checked]:text-[var(--color-gold-dark)] items-center">
                    <input
                      type="radio"
                      name="grade"
                      value={g.key}
                      defaultChecked={params.grade === g.key}
                      className="accent-[var(--color-gold-dark)] h-4 w-4"
                    />
                    <GradeBadge grade={g.key} size="sm" />
                    <span className="truncate">
                      {g.label}
                    </span>
                    <span className="text-[11px] text-[var(--color-ink-muted)] ml-auto">{f.grades[g.key] ?? 0}</span>
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
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRICE_STEPS.map((b) => (
                  <Link
                    key={b.label}
                    href={url({ prixMin: b.min, prixMax: b.max })}
                    className={`chip !text-[11px] ${
                      (params.prixMin ?? "") === b.min && (params.prixMax ?? "") === b.max
                        ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                        : "bg-[var(--color-cream-deep)] text-[var(--color-ink-soft)] hover:bg-[var(--color-sand)]"
                    }`}
                  >
                    {b.label}
                  </Link>
                ))}
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

            {f.brands.length > 1 && (
              <FilterBlock title="Marque">
                <select name="marque" defaultValue={params.marque ?? ""} className="field">
                  <option value="">Toutes les marques</option>
                  {f.brands.map((b) => (
                    <option key={b.brand} value={b.brand}>
                      {b.brand} ({b.count})
                    </option>
                  ))}
                </select>
              </FilterBlock>
            )}

            {f.quartiers.length > 1 && (
              <FilterBlock title="Quartier de l&apos;article">
                <select name="quartier" defaultValue={params.quartier ?? ""} className="field">
                  <option value="">Tout Brazzaville</option>
                  {f.quartiers.map((qt) => (
                    <option key={qt.quartier} value={qt.quartier}>
                      {qt.quartier} ({qt.count})
                    </option>
                  ))}
                </select>
              </FilterBlock>
            )}

            {CITIES.length > 1 && (
              <FilterBlock title="Ville">
                <select name="ville" defaultValue={params.ville ?? ""} className="field">
                  <option value="">Toutes les villes</option>
                  {f.cities.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city} ({c.count})
                    </option>
                  ))}
                </select>
              </FilterBlock>
            )}

            <div className="flex gap-2 pt-2 sticky bottom-0 bg-[var(--color-linen)] lg:static">
              <button className="btn btn-primary flex-1">
                <Icon name="filter" size={14} /> Voir les {total} article{total > 1 ? "s" : ""}
              </button>
              <Link href={basePath} className="btn btn-ghost" title="Réinitialiser">
                <Icon name="refresh" size={15} />
              </Link>
            </div>
          </form>
        </FilterDrawer>

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
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-brand)] mb-2">{title}</p>
      {children}
    </div>
  );
}

function FilterRadio({
  name,
  value,
  label,
  hint,
  count,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  /** Une ligne d'explication sous le libellé, quand le critère mérite un mot. */
  hint?: string;
  /** Nombre d'articles concernés : l'acheteur voit ce qu'il gagne ou perd à cocher. */
  count?: number;
  checked: boolean;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--color-cream-deep)] has-[:checked]:bg-[var(--color-gold-pale)] has-[:checked]:font-semibold has-[:checked]:text-[var(--color-gold-dark)]">
      <input type="radio" name={name} value={value} defaultChecked={checked} className="accent-[var(--color-gold-dark)] mt-0.5 h-4 w-4" />
      <span className="min-w-0 flex-1">
        {label}
        {hint && <span className="block text-[11px] text-[var(--color-ink-muted)] leading-tight">{hint}</span>}
      </span>
      {count != null && <span className="text-[11px] text-[var(--color-ink-muted)] shrink-0">{count}</span>}
    </label>
  );
}

/** Option à cocher : « livrable », « négociable »… Absente de l'URL quand elle n'est pas cochée. */
function FilterCheck({
  name,
  label,
  count,
  checked,
}: {
  name: string;
  label: string;
  count?: number;
  checked: boolean;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--color-cream-deep)] has-[:checked]:bg-[var(--color-gold-pale)] has-[:checked]:font-semibold has-[:checked]:text-[var(--color-gold-dark)] items-center">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="accent-[var(--color-gold-dark)] h-4 w-4" />
      <span className="min-w-0 flex-1">{label}</span>
      {count != null && <span className="text-[11px] text-[var(--color-ink-muted)] shrink-0">{count}</span>}
    </label>
  );
}

