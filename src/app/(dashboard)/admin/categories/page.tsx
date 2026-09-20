import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { VERTICAL_LIST } from "@/lib/constants";
import { createCategoryAction, toggleCategoryAction, deleteCategoryAction } from "@/lib/actions/admin";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";
import { Badge, PageHeader, Card } from "@/components/ui";

export const metadata: Metadata = { title: "Catégories" };

export default async function AdminCategoriesPage() {
  await requireAdmin("/admin/categories");

  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ vertical: "asc" }, { position: "asc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader title="Catégories" subtitle="Organisation du catalogue dans les trois univers." />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VERTICAL_LIST.map((v) => {
            const list = categories.filter((c) => c.vertical === v.key);
            return (
              <Card key={v.key} padded={false}>
                <div className="px-4 py-3 border-b border-[var(--color-sand)] flex items-center justify-between">
                  <h2 className="font-display font-bold">{v.label}</h2>
                  <span className="text-xs text-[var(--color-ink-muted)]">{list.length}</span>
                </div>
                <ul className="divide-y divide-[var(--color-sand)]/70">
                  {list.map((c) => (
                    <li key={c.id} className={`flex items-center gap-2 px-4 py-2.5 ${c.isActive ? "" : "opacity-50"}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-[11px] text-[var(--color-ink-muted)]">
                          {c._count.products} article(s) · /{c.slug}
                        </p>
                      </div>
                      {!c.isActive && <Badge tone="neutral">Masquée</Badge>}
                      <form action={toggleCategoryAction}>
                        <input type="hidden" name="categoryId" value={c.id} />
                        <button
                          className="p-1.5 rounded-md text-[var(--color-ink-muted)] hover:bg-[var(--color-cream-deep)]"
                          title={c.isActive ? "Masquer" : "Afficher"}
                          aria-label={c.isActive ? `Masquer ${c.name}` : `Afficher ${c.name}`}
                        >
                          <Icon name="eye" size={14} />
                        </button>
                      </form>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="categoryId" value={c.id} />
                        <button
                          className="p-1.5 rounded-md text-[var(--color-ink-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-grade-c-bg)]"
                          title={c._count.products ? "Contient des articles : sera masquée" : "Supprimer"}
                          aria-label={`Supprimer ${c.name}`}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <Card>
          <h2 className="font-display text-lg font-bold mb-3">Nouvelle catégorie</h2>
          <ActionForm action={createCategoryAction} submitLabel="Créer" resetOnSuccess submitClassName="btn btn-primary w-full">
            <div className="flex flex-col gap-3">
              <div>
                <label className="label" htmlFor="cat-name">
                  Nom
                </label>
                <input id="cat-name" name="name" className="field" placeholder="Ex. Luminaires d'extérieur" required />
              </div>
              <div>
                <label className="label" htmlFor="cat-vertical">
                  Univers
                </label>
                <select id="cat-vertical" name="vertical" className="field">
                  {VERTICAL_LIST.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ActionForm>
          <p className="text-[11px] text-[var(--color-ink-muted)] mt-3">
            Une catégorie qui contient des articles n&apos;est jamais supprimée : elle est masquée pour préserver
            l&apos;historique.
          </p>
        </Card>
      </div>
    </>
  );
}
