import Link from "next/link";
import type { Metadata } from "next";
import { BRAND, SUPPORT_WHATSAPP } from "@/lib/constants";
import { waLink } from "@/lib/format";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import AuthShell from "@/components/AuthShell";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgottenPasswordPage() {
  const whatsapp = waLink(
    SUPPORT_WHATSAPP,
    "Bonjour Le Beau Défaut, j'ai oublié le mot de passe de mon compte. Voici l'adresse e-mail que j'utilise :"
  );

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Dites-nous quelle adresse vous utilisez : nous vous renvoyons de quoi en choisir un nouveau."
    >
      <div className="flex flex-col gap-5">
        <ActionForm action={requestPasswordResetAction} submitLabel="Demander un nouveau mot de passe" pendingLabel="Envoi…">
          <div>
            <label className="label" htmlFor="email">
              E-mail du compte
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className="field" placeholder="vous@exemple.cg" />
          </div>
        </ActionForm>

        <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-cream-deep)]/60 p-4">
          <p className="text-sm font-semibold mb-1">Comment ça se passe</p>
          <ol className="text-xs text-[var(--color-ink-muted)] flex flex-col gap-1.5 list-decimal pl-4">
            <li>Vous laissez votre adresse ci-dessus.</li>
            <li>Notre équipe vérifie qu&apos;il s&apos;agit bien de vous.</li>
            <li>Vous recevez sur WhatsApp un lien personnel, valable deux heures et utilisable une seule fois.</li>
          </ol>
          <p className="text-[11px] text-[var(--color-ink-muted)] mt-2">
            Le lien n&apos;est jamais affiché ici : sinon, n&apos;importe qui pourrait réclamer le compte d&apos;un autre.
          </p>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm w-full mt-3">
              <Icon name="phone" size={14} /> Nous écrire directement
            </a>
          )}
          <p className="text-[11px] text-[var(--color-ink-muted)] mt-2">
            Ou par e-mail : <span className="font-medium">{BRAND.email}</span>
          </p>
        </div>

        <p className="text-sm text-center text-[var(--color-ink-muted)]">
          <Link href="/connexion" className="underline underline-offset-2 hover:text-[var(--color-ink)]">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
