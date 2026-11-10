import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateFR, dateTimeFR, phoneFR, relativeFR, waLink } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS, CLAIM_STATUS, ROLES, claimTypeLabel, threadKind } from "@/lib/constants";
import { toggleUserActiveAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Avatar, Badge, Card, Stat, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Fiche client" };

/** Tout ce que l'équipe doit savoir d'un client, sur une seule page. */
export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      seller: { select: { shopName: true, shopSlug: true, status: true } },
      courier: { select: { vehicle: true, status: true, totalRuns: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { items: { select: { titleSnapshot: true, quantity: true, imageSnapshot: true } } },
      },
      claims: { orderBy: { createdAt: "desc" }, include: { order: { select: { id: true, reference: true } } } },
      reviews: { orderBy: { createdAt: "desc" }, take: 10, include: { product: { select: { title: true, slug: true } } } },
      _count: { select: { favorites: true, cartItems: true } },
    },
  });
  if (!user) notFound();

  const threads = await prisma.thread.findMany({
    where: { members: { some: { userId: user.id } } },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 }, _count: { select: { messages: true } } },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });

  const paid = user.orders.filter((o) => o.paymentStatus === "PAYE");
  const spent = paid.reduce((s, o) => s + o.total, 0);
  const pending = user.orders.filter((o) => o.status === "EN_ATTENTE_PAIEMENT");
  const cancelled = user.orders.filter((o) => o.status === "ANNULEE").length;
  const wa = waLink(user.phone, `Bonjour ${user.firstName}, c'est Le Beau Défaut.`);

  return (
    <>
      <Link href="/admin/utilisateurs" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Utilisateurs
      </Link>

      <Card className="mb-5">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar first={user.firstName} last={user.lastName} url={user.avatarUrl} size={64} />
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <Badge tone="info">{ROLES[user.role as keyof typeof ROLES]?.label ?? user.role}</Badge>
              {!user.isActive && <Badge tone="danger">Désactivé</Badge>}
            </div>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {user.email} · {phoneFR(user.phone)}
              {user.quartier ? ` · ${user.quartier}` : ""}
              {user.city ? `, ${user.city}` : ""}
            </p>
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
              Inscrit le {dateFR(user.createdAt)} · dernière connexion {relativeFR(user.lastLoginAt)} · {user._count.favorites} favori(s) ·{" "}
              {user._count.cartItems} article(s) dans le panier
            </p>
            {user.seller && (
              <p className="text-xs mt-1">
                Boutique :{" "}
                <Link href={`/boutique/${user.seller.shopSlug}`} className="underline">
                  {user.seller.shopName}
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="btn btn-sm !bg-[#25D366] !text-white">
                <Icon name="phone" size={13} /> WhatsApp
              </a>
            )}
            {user.phone && (
              <a href={`tel:${user.phone}`} className="btn btn-outline btn-sm">
                <Icon name="phone" size={13} /> Appeler
              </a>
            )}
            <a href={`mailto:${user.email}`} className="btn btn-outline btn-sm">
              <Icon name="mail" size={13} /> E-mail
            </a>
            {user.id !== admin.id && (
              <form action={toggleUserActiveAction}>
                <input type="hidden" name="userId" value={user.id} />
                <button className={`btn btn-sm ${user.isActive ? "btn-outline !text-[var(--color-danger)]" : "btn-primary"}`}>
                  {user.isActive ? "Désactiver le compte" : "Réactiver le compte"}
                </button>
              </form>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <Stat label="Commandes" value={user.orders.length} icon="package" />
        <Stat label="Total payé" value={money(spent)} icon="wallet" tone="gold" />
        <Stat label="Paiements attendus" value={pending.length} icon="clock" tone={pending.length ? "danger" : "neutral"} />
        <Stat label="Réclamations" value={user.claims.length} icon="shield" hint={`${cancelled} commande(s) annulée(s)`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <div className="flex flex-col gap-5">
          <Card padded={false}>
            <h2 className="font-display text-lg font-bold p-5 pb-3">Ses commandes</h2>
            {user.orders.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)] px-5 pb-5">Aucune commande pour l&apos;instant.</p>
            ) : (
              <ul className="divide-y divide-[var(--color-sand)]">
                {user.orders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/commandes/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--color-cream-deep)]/60">
                      {o.items[0]?.imageSnapshot && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.items[0].imageSnapshot} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-mono text-xs font-semibold">{o.reference}</span>{" "}
                          <span className="text-[11px] text-[var(--color-ink-muted)]">· {dateTimeFR(o.createdAt)}</span>
                        </p>
                        <p className="text-xs text-[var(--color-ink-muted)] truncate">
                          {o.items.map((i) => `${i.quantity}× ${i.titleSnapshot}`).join(" · ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold whitespace-nowrap" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {money(o.total)}
                        </p>
                        <div className="flex gap-1 justify-end flex-wrap">
                          <Badge tone={ORDER_STATUS[o.status]?.tone ?? "neutral"}>{ORDER_STATUS[o.status]?.label ?? o.status}</Badge>
                          {o.paymentStatus !== "PAYE" && o.status === "EN_ATTENTE_PAIEMENT" && (
                            <Badge tone={o.paymentDeclaredAt ? "info" : "warning"}>
                              {o.paymentDeclaredAt ? "Preuve reçue" : PAYMENT_STATUS[o.paymentStatus]?.label}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Ses réclamations</h2>
            {user.claims.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">Aucune réclamation.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {user.claims.map((c) => (
                  <li key={c.id} className="p-3 rounded-xl bg-[var(--color-cream-deep)]/60">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-semibold">
                        <span className="font-mono text-xs">{c.reference}</span> · {claimTypeLabel(c.type)}
                      </p>
                      <Badge tone={CLAIM_STATUS[c.status]?.tone ?? "neutral"}>{CLAIM_STATUS[c.status]?.label ?? c.status}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-ink-muted)] mt-1 line-clamp-2">{c.description}</p>
                    <p className="text-[11px] mt-1">
                      <Link href={`/admin/commandes/${c.order.id}`} className="underline">
                        {c.order.reference}
                      </Link>{" "}
                      · {relativeFR(c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Conversations</h2>
            {threads.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">Aucun message.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {threads.map((t) => {
                  const kind = threadKind(t.subject);
                  return (
                    <li key={t.id}>
                      <Link href={`/admin/support/${t.id}`} className="block p-2.5 -mx-2.5 rounded-xl hover:bg-[var(--color-cream-deep)]/60">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{t.subject}</p>
                          <Badge tone={kind === "SIGNALEMENT" ? "danger" : kind === "SUPPORT" ? "info" : "neutral"}>
                            {kind === "SIGNALEMENT" ? "Signalement" : kind === "SUPPORT" ? "Support" : "Question"}
                          </Badge>
                        </div>
                        <p className="text-xs text-[var(--color-ink-muted)] truncate">{t.messages[0]?.body ?? "—"}</p>
                        <p className="text-[11px] text-[var(--color-ink-muted)]">
                          {t._count.messages} message(s) · {relativeFR(t.updatedAt)}
                          {t.isClosed ? " · traité" : ""}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Adresses</h2>
            {user.addresses.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">Aucune adresse enregistrée.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {user.addresses.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium">
                      {a.label} {a.isDefault && <Badge tone="success">Par défaut</Badge>}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {a.fullName} · {phoneFR(a.phone)} · {a.quartier}, {a.city}
                      {a.landmark ? ` · ${a.landmark}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {user.reviews.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-3">Ses avis</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {user.reviews.map((r) => (
                  <li key={r.id}>
                    <Link href={`/produit/${r.product.slug}`} className="font-medium hover:underline">
                      {r.product.title}
                    </Link>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {r.rating}/5 · {r.defectAsDescribed ? "défaut conforme" : "défaut NON conforme"}
                      {r.comment ? ` · « ${r.comment} »` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {user.orders.length === 0 && user.claims.length === 0 && threads.length === 0 && (
            <EmptyState icon="user" title="Compte sans activité" message="Ce client n'a encore rien commandé ni écrit." />
          )}
        </div>
      </div>
    </>
  );
}
