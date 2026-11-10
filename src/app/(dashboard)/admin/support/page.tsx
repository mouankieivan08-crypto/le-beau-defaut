import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { relativeFR } from "@/lib/format";
import { SUPPORT_PREFIX, REPORT_PREFIX, threadKind } from "@/lib/constants";
import Icon from "@/components/Icon";
import { Avatar, Badge, EmptyState, PageHeader, Stat } from "@/components/ui";

export const metadata: Metadata = { title: "Support client" };

const TABS = [
  { key: "", label: "Tout" },
  { key: "SUPPORT", label: "Support client" },
  { key: "SIGNALEMENT", label: "Signalements" },
  { key: "QUESTION", label: "Questions sur les articles" },
];

function whereForKind(kind: string): Prisma.ThreadWhereInput {
  if (kind === "SUPPORT") return { subject: { startsWith: SUPPORT_PREFIX } };
  if (kind === "SIGNALEMENT") return { subject: { startsWith: REPORT_PREFIX } };
  if (kind === "QUESTION") return { NOT: [{ subject: { startsWith: SUPPORT_PREFIX } }, { subject: { startsWith: REPORT_PREFIX } }] };
  return {};
}

/**
 * Toutes les conversations de l'application au même endroit : demandes au service client,
 * annonces signalées et questions posées sur les articles. « À traiter » = le client a écrit
 * en dernier et personne de l'équipe n'a encore répondu.
 */
export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; vue?: string; q?: string }>;
}) {
  await requireAdmin("/admin/support");
  const { type = "", vue = "a-traiter", q = "" } = await searchParams;

  const where: Prisma.ThreadWhereInput = { ...whereForKind(type), messages: { some: {} } };
  if (vue === "traites") where.isClosed = true;
  else if (vue === "a-traiter") where.isClosed = false;
  if (q) {
    where.AND = [
      {
        OR: [
          { subject: { contains: q, mode: "insensitive" } },
          { messages: { some: { body: { contains: q, mode: "insensitive" } } } },
          { members: { some: { user: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } } } },
        ],
      },
    ];
  }

  const [threads, counts] = await Promise.all([
    prisma.thread.findMany({
      where,
      include: {
        product: { select: { title: true, images: { where: { isCover: true }, take: 1 } } },
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { role: true, firstName: true } } } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 150,
    }),
    Promise.all(
      ["SUPPORT", "SIGNALEMENT", "QUESTION"].map((k) =>
        prisma.thread.count({ where: { ...whereForKind(k), isClosed: false, messages: { some: {} } } })
      )
    ),
  ]);

  const rows = threads.map((t) => {
    const last = t.messages[0];
    const waiting = !t.isClosed && !!last && last.sender.role !== "ADMIN";
    const client = t.members.map((m) => m.user).find((u) => u.role === "CLIENT") ?? t.members.map((m) => m.user).find((u) => u.role !== "ADMIN");
    return { t, last, waiting, client, kind: threadKind(t.subject) };
  });
  // Les conversations qui attendent une réponse passent devant.
  rows.sort((a, b) => Number(b.waiting) - Number(a.waiting));

  const qs = (patch: Record<string, string>) => {
    const sp = new URLSearchParams(Object.entries({ type, vue, q, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/support${sp.toString() ? `?${sp}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Support client"
        icon="message"
        subtitle="Demandes des clients, annonces signalées et questions sur les articles. Répondez d'ici : le client est notifié."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Stat label="Support à traiter" value={counts[0]} icon="message" tone={counts[0] ? "danger" : "success"} href={qs({ type: "SUPPORT", vue: "a-traiter" })} />
        <Stat label="Signalements ouverts" value={counts[1]} icon="alert" tone={counts[1] ? "danger" : "success"} href={qs({ type: "SIGNALEMENT", vue: "a-traiter" })} />
        <Stat label="Questions ouvertes" value={counts[2]} icon="info" href={qs({ type: "QUESTION", vue: "a-traiter" })} />
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between mb-4">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={qs({ type: t.key })}
              className={`chip !text-xs !px-3 !py-1.5 whitespace-nowrap ${
                type === t.key
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)]"
                  : "bg-[var(--color-linen)] border border-[var(--color-sand)] text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-1.5">
          {[
            { k: "a-traiter", l: "Ouvertes" },
            { k: "traites", l: "Traitées" },
            { k: "toutes", l: "Toutes" },
          ].map((v) => (
            <Link key={v.k} href={qs({ vue: v.k })} className={`btn btn-sm ${vue === v.k ? "btn-primary" : "btn-ghost"}`}>
              {v.l}
            </Link>
          ))}
        </div>
      </div>

      <form action="/admin/support" className="flex gap-2 mb-5">
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="vue" value={vue} />
        <div className="relative flex-1 max-w-md">
          <input name="q" defaultValue={q} placeholder="Nom du client, e-mail, mot dans le message…" className="field pl-8" />
          <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        </div>
        <button className="btn btn-primary btn-sm">Chercher</button>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon="check-circle" title="Rien à traiter" message="Aucune conversation ne correspond. Bravo, la file est vide." />
      ) : (
        <ul className="surface divide-y divide-[var(--color-sand)] overflow-hidden">
          {rows.map(({ t, last, waiting, client, kind }) => (
            <li key={t.id}>
              <Link
                href={`/admin/support/${t.id}`}
                className={`flex items-center gap-3.5 p-4 hover:bg-[var(--color-cream-deep)]/60 transition-colors ${waiting ? "bg-[var(--color-gold-pale)]/25" : ""}`}
              >
                <Avatar first={client?.firstName ?? "?"} last={client?.lastName ?? ""} url={client?.avatarUrl} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${waiting ? "font-bold" : "font-medium"}`}>
                      {client ? `${client.firstName} ${client.lastName}` : "—"}
                    </p>
                    <span className="text-[11px] text-[var(--color-ink-muted)] shrink-0">{last ? relativeFR(last.createdAt) : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge tone={kind === "SIGNALEMENT" ? "danger" : kind === "SUPPORT" ? "info" : "neutral"}>
                      {kind === "SIGNALEMENT" ? "Signalement" : kind === "SUPPORT" ? "Support" : "Question"}
                    </Badge>
                    <p className="text-xs text-[var(--color-gold-dark)] truncate">{t.product?.title ?? t.subject.replace(SUPPORT_PREFIX, "")}</p>
                  </div>
                  <p className={`text-sm truncate ${waiting ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"}`}>
                    {last ? `${last.sender.role === "ADMIN" ? `${last.sender.firstName} (équipe) : ` : ""}${last.body}` : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {waiting ? <Badge tone="danger">À répondre</Badge> : t.isClosed ? <Badge tone="success">Traité</Badge> : <Badge tone="neutral">Répondu</Badge>}
                  <span className="text-[11px] text-[var(--color-ink-muted)]">{t._count.messages} msg</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
