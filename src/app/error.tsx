"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import Icon from "@/components/Icon";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // En production, brancher ici le service de suivi d'erreurs.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[70vh] grid place-items-center px-4 py-16">
      <div className="text-center max-w-md">
        <Logo variant="mark" size={84} className="mx-auto" />
        <h1 className="font-display text-2xl font-bold mt-5">Un défaut de notre côté cette fois</h1>
        <p className="text-[var(--color-ink-muted)] mt-2">
          La page n&apos;a pas pu s&apos;afficher. Réessayez : c&apos;est souvent passager, surtout si la connexion
          est faible.
        </p>
        {error.digest && (
          <p className="text-[11px] text-[var(--color-ink-muted)] mt-2 font-mono">Référence : {error.digest}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3 mt-7">
          <button onClick={reset} className="btn btn-primary">
            <Icon name="refresh" size={15} /> Réessayer
          </button>
          <Link href="/" className="btn btn-outline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
