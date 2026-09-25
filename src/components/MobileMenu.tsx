"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Icon from "./Icon";
import Logo from "./Logo";
import { VERTICAL_LIST, homeForRole } from "@/lib/constants";

export default function MobileMenu({
  isLoggedIn,
  role,
  canSell = false,
}: {
  isLoggedIn: boolean;
  role: string | null;
  canSell?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [monte, setMonte] = useState(false);

  // Le portail ne peut viser document.body qu'une fois la page rendue par le navigateur.
  useEffect(() => setMonte(true), []);

  // Menu ouvert : la page derrière ne défile plus, et Échap referme.
  useEffect(() => {
    if (!open) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", auClavier);
    return () => {
      document.body.style.overflow = precedent;
      window.removeEventListener("keydown", auClavier);
    };
  }, [open]);

  const fermer = () => setOpen(false);

  /**
   * Le panneau est monté directement dans <body>.
   *
   * L'en-tête porte un flou d'arrière-plan (`backdrop-filter`) : en CSS, cela en fait
   * le cadre de référence de tout élément « fixe » placé à l'intérieur. Rendu là,
   * le menu se retrouvait rogné à la hauteur de l'en-tête — d'où le portail.
   */
  const panneau = (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-[var(--color-ink)]/45 backdrop-blur-sm" onClick={fermer} />
      <nav className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[var(--color-cream)] shadow-2xl flex flex-col animate-fade-up overflow-y-auto overscroll-contain">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-sand)] sticky top-0 bg-[var(--color-cream)] z-10">
          <Logo size={34} variant="full" />
          <button onClick={fermer} className="btn btn-ghost !px-2" aria-label="Fermer le menu">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form action="/catalogue" className="p-4 relative" onSubmit={fermer}>
          <input type="search" name="q" placeholder="Rechercher…" className="field pl-9 rounded-full" />
          <Icon
            name="search"
            size={16}
            className="absolute left-7 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
          />
        </form>

        <div className="px-3 pb-3 flex flex-col gap-0.5">
          <p className="label px-3 pt-2 pb-1">Nos univers</p>
          {VERTICAL_LIST.map((v) => (
            <Link
              key={v.key}
              href={`/${v.slug}`}
              onClick={fermer}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
            >
              <Icon name="tag" size={16} className="text-[var(--color-gold-dark)]" /> {v.label}
            </Link>
          ))}
          <Link
            href="/catalogue"
            onClick={fermer}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
          >
            <Icon name="grid" size={16} className="text-[var(--color-gold-dark)]" /> Tout le catalogue
          </Link>
          <Link
            href="/le-defaut"
            onClick={fermer}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
          >
            <Icon name="shield" size={16} className="text-[var(--color-gold-dark)]" /> La grille du défaut
          </Link>

          <div className="border-t border-[var(--color-sand)] mt-2 pt-2 flex flex-col gap-0.5">
            {isLoggedIn ? (
              <>
                <Link
                  href={homeForRole(role ?? "CLIENT")}
                  onClick={fermer}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                >
                  <Icon name="grid" size={16} /> Tableau de bord
                </Link>
                <Link
                  href="/compte/commandes"
                  onClick={fermer}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                >
                  <Icon name="package" size={16} /> Mes commandes
                </Link>
                {canSell ? (
                  <Link
                    href="/vendeur"
                    onClick={fermer}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                  >
                    <Icon name="tag" size={16} /> Espace vente
                  </Link>
                ) : (
                  <Link
                    href="/devenir-vendeur"
                    onClick={fermer}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-gold-pale)] text-sm font-medium text-[var(--color-gold-dark)]"
                  >
                    <Icon name="tag" size={16} /> Ouvrir une boutique
                  </Link>
                )}
                <Link
                  href="/compte/favoris"
                  onClick={fermer}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                >
                  <Icon name="heart" size={16} /> Mes favoris
                </Link>
                <Link
                  href="/messages"
                  onClick={fermer}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                >
                  <Icon name="message" size={16} /> Messages
                </Link>
                <a
                  href="/api/deconnexion"
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-grade-c-bg)] text-sm font-medium text-[var(--color-danger)]"
                >
                  <Icon name="logout" size={16} /> Se déconnecter
                </a>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-1 pt-1">
                <Link href="/connexion" onClick={fermer} className="btn btn-outline w-full">
                  Connexion
                </Link>
                <Link href="/inscription" onClick={fermer} className="btn btn-gold w-full">
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-ghost !px-2.5 lg:hidden"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Icon name="menu" size={21} />
      </button>

      {open && monte && createPortal(panneau, document.body)}
    </>
  );
}
