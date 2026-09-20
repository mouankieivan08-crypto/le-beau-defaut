import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { dateTimeFR } from "@/lib/format";
import { PageHeader, Avatar, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Journal d'activité" };

const LABELS: Record<string, string> = {
  APPROUVER_ANNONCE: "a publié une annonce",
  REJETER_ANNONCE: "a renvoyé une annonce",
  BASCULER_isFeatured: "a modifié un coup de cœur",
  BASCULER_isFlashDeal: "a modifié une bonne affaire",
  AUTHENTICITE: "a mis à jour une authentification",
  STATUT_VENDEUR: "a changé le statut d'une boutique",
  COMMISSION: "a modifié une commission",
  DESACTIVER_USER: "a désactivé un compte",
  ACTIVER_USER: "a réactivé un compte",
  ROLE: "a changé un rôle",
  CREER_USER: "a créé un compte",
  ASSIGNER_LIVREUR: "a assigné un livreur",
  VERSEMENT_PAYE: "a validé un versement",
  CREER_CATEGORIE: "a créé une catégorie",
  REGLAGES: "a modifié les paramètres",
};

export default async function AdminJournalPage() {
  await requireAdmin("/admin/journal");
  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Journal d'activité" subtitle="Les actions sensibles de l'équipe, pour la traçabilité." />
      {logs.length === 0 ? (
        <EmptyState icon="list" title="Journal vide" />
      ) : (
        <ul className="surface divide-y divide-[var(--color-sand)]">
          {logs.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-5 py-3">
              <Avatar first={l.actor?.firstName ?? "?"} last={l.actor?.lastName ?? ""} url={l.actor?.avatarUrl} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <strong className="font-semibold">{l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : "Système"}</strong>{" "}
                  {LABELS[l.action] ?? l.action.toLowerCase().replace(/_/g, " ")}
                  {l.details && <span className="text-[var(--color-ink-muted)]"> — {l.details}</span>}
                </p>
                <p className="text-[11px] text-[var(--color-ink-muted)]">
                  {l.entity}
                  {l.entityId ? ` · ${l.entityId}` : ""}
                </p>
              </div>
              <time className="text-xs text-[var(--color-ink-muted)] whitespace-nowrap">{dateTimeFR(l.createdAt)}</time>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
