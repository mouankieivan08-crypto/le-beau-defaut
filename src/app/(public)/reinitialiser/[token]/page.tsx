import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { resetPasswordAction } from "@/lib/actions/auth";
import AuthShell from "@/components/AuthShell";
import ActionForm from "@/components/ActionForm";
import { Alert } from "@/components/ui";

export const metadata: Metadata = {
  title: "Nouveau mot de passe",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const demande = await prisma.passwordReset.findUnique({
    where: { token },
    select: { usedAt: true, expiresAt: true, user: { select: { firstName: true, email: true } } },
  });

  const valable = demande && !demande.usedAt && demande.expiresAt > new Date();

  if (!valable) {
    return (
      <AuthShell title="Lien expiré" subtitle="Ce lien a déjà servi, ou il a plus de deux heures.">
        <div className="flex flex-col gap-4">
          <Alert tone="warning">
            Par sécurité, un lien de réinitialisation ne fonctionne qu&apos;une fois et pendant deux heures.
          </Alert>
          <Link href="/mot-de-passe-oublie" className="btn btn-primary w-full">
            Demander un nouveau lien
          </Link>
          <Link href="/connexion" className="text-sm text-center text-[var(--color-ink-muted)] underline underline-offset-2">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={`Bonjour ${demande.user.firstName}`}
      subtitle="Choisissez un nouveau mot de passe pour votre compte."
    >
      <ActionForm action={resetPasswordAction} submitLabel="Enregistrer le mot de passe" pendingLabel="Enregistrement…">
        <div className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <p className="text-xs text-[var(--color-ink-muted)]">
            Compte : <span className="font-medium text-[var(--color-ink)]">{demande.user.email}</span>
          </p>
          <div>
            <label className="label" htmlFor="password">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="field"
            />
            <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">
              Huit caractères minimum. Évitez votre nom et les suites de chiffres.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Confirmation
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="field"
            />
          </div>
        </div>
      </ActionForm>

      <p className="text-sm text-center text-[var(--color-ink-muted)] mt-4">
        <Link href="/connexion" className="underline underline-offset-2 hover:text-[var(--color-ink)]">
          Aller à la connexion
        </Link>
      </p>
    </AuthShell>
  );
}
