import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { dateTimeFR, money, phoneFR, relativeFR, waLink } from "@/lib/format";
import { ORDER_STATUS, PRODUCT_STATUS, threadKind } from "@/lib/constants";
import { adminReplyAction, toggleThreadClosedAction } from "@/lib/actions/admin";
import Icon from "@/components/Icon";
import { Badge, Card, GradeBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Conversation" };

const QUICK_REPLIES = [
  "Bonjour, merci pour votre message. Nous regardons votre demande et revenons vers vous très vite.",
  "Nous avons bien reçu votre paiement : votre commande est confirmée.",
  "Nous ne retrouvons pas encore votre dépôt. Pouvez-vous nous renvoyer la capture avec le numéro de transaction ?",
  "Merci pour le signalement, nous vérifions l'annonce.",
];

export default async function AdminThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          reference: true,
          price: true,
          status: true,
          defectGrade: true,
          images: { where: { isCover: true }, take: 1 },
        },
      },
      members: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true } },
        },
      },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { firstName: true, lastName: true, role: true } } } },
    },
  });
  if (!thread) notFound();

  // L'admin qui ouvre la conversation la marque comme lue pour lui.
  await prisma.threadMember.updateMany({ where: { threadId: id, userId: admin.id }, data: { lastReadAt: new Date() } });

  const client = thread.members.map((m) => m.user).find((u) => u.role === "CLIENT") ?? thread.members.map((m) => m.user).find((u) => u.role !== "ADMIN");
  const orders = client
    ? await prisma.order.findMany({
        where: { buyerId: client.id },
        select: { id: true, reference: true, status: true, total: true, createdAt: true, paymentDeclaredAt: true, paymentStatus: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];
  const kind = threadKind(thread.subject);
  const wa = waLink(client?.phone, client ? `Bonjour ${client.firstName}, c'est Le Beau Défaut.` : undefined);

  return (
    <>
      <Link href="/admin/support" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Support client
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5 items-start">
        <div className="surface overflow-hidden flex flex-col" style={{ minHeight: "60vh" }}>
          <header className="flex items-center justify-between gap-3 p-4 border-b border-[var(--color-sand)] flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge tone={kind === "SIGNALEMENT" ? "danger" : kind === "SUPPORT" ? "info" : "neutral"}>
                  {kind === "SIGNALEMENT" ? "Signalement" : kind === "SUPPORT" ? "Support" : "Question sur un article"}
                </Badge>
                {thread.isClosed && <Badge tone="success">Traité</Badge>}
              </div>
              <p className="font-semibold text-sm mt-1 truncate">{thread.subject}</p>
              <p className="text-[11px] text-[var(--color-ink-muted)]">Ouverte le {dateTimeFR(thread.createdAt)}</p>
            </div>
            <form action={toggleThreadClosedAction}>
              <input type="hidden" name="threadId" value={thread.id} />
              <button className={`btn btn-sm ${thread.isClosed ? "btn-outline" : "btn-primary"}`}>
                <Icon name={thread.isClosed ? "refresh" : "check"} size={13} /> {thread.isClosed ? "Rouvrir" : "Marquer comme traité"}
              </button>
            </form>
          </header>

          <div className="flex-1 p-4 sm:p-6 flex flex-col gap-3 bg-[var(--color-cream)]/50">
            {thread.messages.map((m) => {
              const team = m.sender.role === "ADMIN";
              return (
                <div key={m.id} className={`flex ${team ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      team
                        ? "bg-[var(--color-ink)] text-[var(--color-cream)] rounded-br-md"
                        : "bg-[var(--color-linen)] border border-[var(--color-sand)] rounded-bl-md"
                    }`}
                  >
                    <p className={`text-[10px] font-semibold mb-0.5 ${team ? "text-[var(--color-cream)]/70" : "text-[var(--color-gold-dark)]"}`}>
                      {m.sender.firstName} {m.sender.lastName}
                      {team ? " · équipe" : ""}
                    </p>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${team ? "text-[var(--color-cream)]/55" : "text-[var(--color-ink-muted)]"}`}>{dateTimeFR(m.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form action={adminReplyAction} className="p-3 border-t border-[var(--color-sand)] flex flex-col gap-2">
            <input type="hidden" name="threadId" value={thread.id} />
            <details>
              <summary className="text-xs text-[var(--color-ink-muted)] cursor-pointer">Réponses rapides</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {QUICK_REPLIES.map((r) => (
                  <li key={r} className="text-xs p-2 rounded-lg bg-[var(--color-cream-deep)]/60 select-all">
                    {r}
                  </li>
                ))}
              </ul>
            </details>
            <div className="flex gap-2 items-end">
              <textarea name="body" rows={3} required placeholder="Votre réponse au client…" className="field resize-none" aria-label="Votre réponse" />
              <button className="btn btn-primary !px-4 !py-3" aria-label="Envoyer">
                <Icon name="arrow-right" size={17} />
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-5">
          {client && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg font-bold">Client</h2>
                <Link href={`/admin/utilisateurs/${client.id}`} className="btn btn-ghost btn-sm">
                  Fiche <Icon name="arrow-right" size={13} />
                </Link>
              </div>
              <p className="font-semibold">
                {client.firstName} {client.lastName}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">{client.email}</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{phoneFR(client.phone)}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className="btn btn-sm !bg-[#25D366] !text-white">
                    <Icon name="phone" size={13} /> WhatsApp
                  </a>
                )}
                {client.phone && (
                  <a href={`tel:${client.phone}`} className="btn btn-outline btn-sm">
                    Appeler
                  </a>
                )}
              </div>
              {orders.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[var(--color-sand)]">
                  <p className="label">Ses dernières commandes</p>
                  <ul className="flex flex-col gap-1.5">
                    {orders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-2 text-xs">
                        <Link href={`/admin/commandes/${o.id}`} className="font-mono hover:text-[var(--color-gold-dark)]">
                          {o.reference}
                        </Link>
                        <span className="flex items-center gap-1.5">
                          {money(o.total, false)}
                          <Badge tone={ORDER_STATUS[o.status]?.tone ?? "neutral"}>
                            {o.status === "EN_ATTENTE_PAIEMENT" && o.paymentDeclaredAt ? "Preuve reçue" : ORDER_STATUS[o.status]?.label}
                          </Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {thread.product && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-3">{kind === "SIGNALEMENT" ? "Annonce signalée" : "Article concerné"}</h2>
              <div className="flex gap-3">
                {thread.product.images[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thread.product.images[0].url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{thread.product.title}</p>
                  <p className="text-[11px] font-mono text-[var(--color-ink-muted)]">{thread.product.reference}</p>
                  <p className="text-xs flex items-center gap-1.5 mt-1">
                    <GradeBadge grade={thread.product.defectGrade} size="sm" /> {money(thread.product.price)}
                  </p>
                  <Badge tone={PRODUCT_STATUS[thread.product.status]?.tone ?? "neutral"} className="mt-1">
                    {PRODUCT_STATUS[thread.product.status]?.label ?? thread.product.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link href={`/admin/annonces/${thread.product.id}`} className="btn btn-outline btn-sm">
                  Modérer l&apos;annonce
                </Link>
                <Link href={`/produit/${thread.product.slug}`} className="btn btn-ghost btn-sm">
                  Voir la fiche
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <h2 className="font-display text-base font-bold mb-2">Participants</h2>
            <ul className="text-xs flex flex-col gap-1">
              {thread.members.map((m) => (
                <li key={m.id} className="flex justify-between gap-2">
                  <span>
                    {m.user.firstName} {m.user.lastName} <span className="text-[var(--color-ink-muted)]">· {m.user.role.toLowerCase()}</span>
                  </span>
                  <span className="text-[var(--color-ink-muted)]">{m.lastReadAt ? `lu ${relativeFR(m.lastReadAt)}` : "non lu"}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
