import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { siteUrl } from "@/lib/site";
import { dateTimeFR, phoneFR, waLink } from "@/lib/format";
import { markResetSentAction } from "@/lib/actions/auth";
import CopyLink from "@/components/CopyLink";
import Icon from "@/components/Icon";
import { Badge, PageHeader, EmptyState, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Mots de passe oubliés" };

/**
 * Les demandes de nouveau mot de passe.
 *
 * Tant qu'aucun e-mail ne part du site, c'est l'équipe qui transmet le lien, après
 * avoir vérifié que la personne est bien la titulaire du compte — un appel, un
 * message WhatsApp depuis le numéro enregistré. Le lien expire au bout de deux heures.
 */
export default async function ResetRequestsPage() {
  await requireAdmin("/admin/reinitialisations");

  const demandes = await prisma.passwordReset.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: { select: { firstName: true, lastName: true, email: true, phone: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });

  const recentesUtilisees = await prisma.passwordReset.findMany({
    where: { usedAt: { not: null } },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
    orderBy: { usedAt: "desc" },
    take: 5,
  });

  const base = siteUrl();

  return (
    <>
      <PageHeader
        title="Mots de passe oubliés"
        subtitle="Vérifiez l'identité de la personne, puis envoyez-lui son lien. Il expire au bout de deux heures et ne sert qu'une fois."
      />

      <div className="mb-5">
        <Alert tone="info" title="Avant d'envoyer un lien">
          Appelez le numéro enregistré sur le compte, ou attendez un message WhatsApp venant de ce numéro.
          Un lien envoyé à la mauvaise personne donne accès au compte.
        </Alert>
      </div>

      {demandes.length === 0 ? (
        <EmptyState icon="check-circle" title="Aucune demande en attente" message="Personne n'a oublié son mot de passe." />
      ) : (
        <div className="flex flex-col gap-3">
          {demandes.map((d) => {
            const lien = `${base}/reinitialiser/${d.token}`;
            const whatsapp = waLink(
              d.user.phone,
              `Bonjour ${d.user.firstName}, voici votre lien pour choisir un nouveau mot de passe sur Le Beau Défaut. Il est valable deux heures et ne fonctionne qu'une fois : ${lien}`
            );
            return (
              <div key={d.id} className="surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">
                      {d.user.firstName} {d.user.lastName}
                      <Badge tone="neutral" className="ml-2">
                        {d.user.role.toLowerCase()}
                      </Badge>
                      {d.sentAt && <Badge tone="success" className="ml-1">Lien envoyé</Badge>}
                    </p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {d.user.email}
                      {d.user.phone ? ` · ${phoneFR(d.user.phone)}` : " · aucun numéro enregistré"}
                    </p>
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-muted)] text-right">
                    Demandé le {dateTimeFR(d.createdAt)}
                    <span className="block">Expire le {dateTimeFR(d.expiresAt)}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--color-sand)]">
                  <CopyLink value={lien} />
                  {whatsapp ? (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">
                      <Icon name="phone" size={14} /> Envoyer sur WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--color-ink-muted)]">
                      Pas de numéro : transmettez le lien par un autre moyen sûr.
                    </span>
                  )}
                  {!d.sentAt && (
                    <form action={markResetSentAction}>
                      <input type="hidden" name="resetId" value={d.id} />
                      <button className="btn btn-ghost btn-sm">
                        <Icon name="check" size={14} /> Marquer comme envoyé
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recentesUtilisees.length > 0 && (
        <section className="surface p-4 mt-6">
          <h2 className="font-display text-base font-bold mb-2">Dernières réinitialisations abouties</h2>
          <ul className="flex flex-col gap-1.5 text-xs text-[var(--color-ink-muted)]">
            {recentesUtilisees.map((r) => (
              <li key={r.id}>
                {r.user.firstName} {r.user.lastName} ({r.user.email}) — {dateTimeFR(r.usedAt)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
