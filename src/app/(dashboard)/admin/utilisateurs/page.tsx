import Link from "next/link";
import ResponsiveTable from "@/components/ResponsiveTable";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { dateFR, relativeFR, phoneFR } from "@/lib/format";
import { ROLES } from "@/lib/constants";
import { toggleUserActiveAction, setUserRoleAction, createUserAction } from "@/lib/actions/admin";
import ActionForm from "@/components/ActionForm";
import ResetPassword from "@/components/ResetPassword";
import Icon from "@/components/Icon";
import { Badge, PageHeader, Avatar, Card } from "@/components/ui";

export const metadata: Metadata = { title: "Utilisateurs" };

const ROLE_TONE: Record<string, string> = { CLIENT: "neutral", VENDEUR: "warning", LIVREUR: "info", ADMIN: "danger" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string }>;
}) {
  const admin = await requireAdmin("/admin/utilisateurs");
  const { role = "", q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const PER = 30;

  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total, byRole] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        seller: { select: { shopName: true } },
        _count: { select: { orders: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PER,
      take: PER,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ]);
  const countBy = Object.fromEntries(byRole.map((r) => [r.role, r._count])) as Record<string, number>;
  const pages = Math.max(1, Math.ceil(total / PER));

  return (
    <>
      <PageHeader title="Utilisateurs" subtitle="Clients, vendeurs, livreurs et administrateurs." />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div>
          <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
            {[{ key: "", label: "Tous", n: byRole.reduce((s, r) => s + r._count, 0) }, ...Object.values(ROLES).map((r) => ({ key: r.key, label: r.label + "s", n: countBy[r.key] ?? 0 }))].map(
              (t) => (
                <Link
                  key={t.key}
                  href={`/admin/utilisateurs${t.key ? `?role=${t.key}` : ""}`}
                  className={`chip !text-xs !px-3 !py-1.5 ${
                    role === t.key
                      ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                      : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)]"
                  }`}
                >
                  {t.label} <span className="opacity-60">{t.n}</span>
                </Link>
              )
            )}
          </div>

          <form action="/admin/utilisateurs" className="flex gap-2 mb-4">
            {role && <input type="hidden" name="role" value={role} />}
            <div className="relative flex-1 max-w-sm">
              <input name="q" defaultValue={q} placeholder="Nom, e-mail, téléphone…" className="field pl-8" />
              <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
            </div>
            <button className="btn btn-primary btn-sm">Rechercher</button>
          </form>

          <ResponsiveTable>
            <table className="table-lbd">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Activité</th>
                  <th>Statut</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.isActive ? "" : "opacity-60"}>
                    <td className="min-w-[230px]">
                      <div className="flex items-center gap-2.5">
                        <Avatar first={u.firstName} last={u.lastName} url={u.avatarUrl} size={34} />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-[11px] text-[var(--color-ink-muted)] truncate">
                            {u.email} · {phoneFR(u.phone)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={ROLE_TONE[u.role]}>{ROLES[u.role as keyof typeof ROLES]?.label}</Badge>
                      {u.seller && <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">{u.seller.shopName}</p>}
                    </td>
                    <td className="text-xs text-[var(--color-ink-muted)] whitespace-nowrap">
                      <p>Inscrit le {dateFR(u.createdAt)}</p>
                      <p>Connexion {u.lastLoginAt ? relativeFR(u.lastLoginAt) : "—"}</p>
                      <p>
                        {u._count.orders} commande(s){u.role === "VENDEUR" ? ` · ${u._count.products} annonce(s)` : ""}
                      </p>
                    </td>
                    <td>
                      <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Actif" : "Désactivé"}</Badge>
                    </td>
                    <td className="text-right">
                      {u.id === admin.id ? (
                        <span className="text-xs text-[var(--color-ink-muted)]">Vous</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <form action={setUserRoleAction} className="flex gap-1">
                            <input type="hidden" name="userId" value={u.id} />
                            <select name="role" defaultValue={u.role} className="field !py-1 !w-auto text-xs" aria-label="Rôle">
                              {Object.values(ROLES).map((r) => (
                                <option key={r.key} value={r.key}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <button className="btn btn-ghost btn-sm !px-2" aria-label="Changer le rôle">
                              <Icon name="check" size={13} />
                            </button>
                          </form>
                          <ResetPassword userId={u.id} name={`${u.firstName} ${u.lastName}`} />
                          <form action={toggleUserActiveAction}>
                            <input type="hidden" name="userId" value={u.id} />
                            <button className={`btn btn-sm ${u.isActive ? "btn-outline !text-[var(--color-danger)]" : "btn-outline"}`}>
                              {u.isActive ? "Désactiver" : "Réactiver"}
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>

          {pages > 1 && (
            <div className="flex justify-end gap-2 mt-4">
              {pageNum > 1 && (
                <Link href={`/admin/utilisateurs?${new URLSearchParams({ role, q, page: String(pageNum - 1) })}`} className="btn btn-outline btn-sm">
                  Précédente
                </Link>
              )}
              {pageNum < pages && (
                <Link href={`/admin/utilisateurs?${new URLSearchParams({ role, q, page: String(pageNum + 1) })}`} className="btn btn-outline btn-sm">
                  Suivante
                </Link>
              )}
            </div>
          )}
        </div>

        <Card>
          <h2 className="font-display text-lg font-bold mb-1">Créer un compte</h2>
          <p className="text-xs text-[var(--color-ink-muted)] mb-4">
            Pour un livreur, un membre de l&apos;équipe ou une entreprise partenaire accompagnée.
          </p>
          <ActionForm action={createUserAction} submitLabel="Créer le compte" resetOnSuccess submitClassName="btn btn-primary w-full">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <input name="firstName" placeholder="Prénom" className="field" required />
                <input name="lastName" placeholder="Nom" className="field" required />
              </div>
              <input name="email" type="email" placeholder="E-mail" className="field" required />
              <input name="phone" type="tel" placeholder="Téléphone" className="field" />
              <select name="role" className="field" defaultValue={role || "LIVREUR"}>
                {Object.values(ROLES).map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <input name="password" type="text" placeholder="Mot de passe provisoire (8+)" className="field" minLength={8} required />
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
