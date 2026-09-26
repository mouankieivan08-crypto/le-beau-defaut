"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "./Icon";

const CLE = "lbd-cookies-vus";

/**
 * Bandeau d'information sur les cookies.
 *
 * Le site ne dépose qu'un cookie de session, strictement nécessaire : il n'y a donc
 * rien à accepter ou à refuser, seulement à dire clairement. Le bandeau se ferme une
 * fois lu, et ce choix reste dans le navigateur du visiteur.
 */
export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CLE)) setVisible(true);
    } catch {
      // Navigation privée ou stockage bloqué : on n'insiste pas.
    }
  }, []);

  if (!visible) return null;

  const fermer = () => {
    try {
      localStorage.setItem(CLE, "1");
    } catch {
      /* rien à enregistrer, le bandeau réapparaîtra */
    }
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4" role="region" aria-label="Information sur les cookies">
      <div className="mx-auto max-w-[900px] surface p-4 shadow-xl flex flex-col sm:flex-row sm:items-center gap-3">
        <Icon name="shield" size={20} className="text-[var(--color-gold-dark)] shrink-0" />
        <p className="text-sm text-[var(--color-ink-soft)] flex-1">
          Ce site ne dépose qu&apos;un <strong>cookie de connexion</strong>, nécessaire pour vous garder connecté.
          Aucun traceur publicitaire, aucune mesure d&apos;audience, aucune donnée revendue.{" "}
          <Link href="/confidentialite" className="underline underline-offset-2 hover:text-[var(--color-ink)]">
            En savoir plus
          </Link>
          .
        </p>
        <button onClick={fermer} className="btn btn-primary btn-sm shrink-0">
          J&apos;ai compris
        </button>
      </div>
    </div>
  );
}
