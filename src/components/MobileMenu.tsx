"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import Logo from "./Logo";
import { VERTICAL_LIST, homeForRole } from "@/lib/constants";

export default function MobileMenu({ isLoggedIn, role }: { isLoggedIn: boolean; role: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-ghost !px-2.5 lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Icon name="menu" size={21} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--color-ink)]/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[var(--color-cream)] shadow-2xl flex flex-col animate-fade-up overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-sand)]">
              <Logo size={34} variant="full" />
              <button onClick={() => setOpen(false)} className="btn btn-ghost !px-2" aria-label="Fermer">
                <Icon name="close" size={20} />
              </button>
            </div>

            <form action="/catalogue" className="p-4 relative" onSubmit={() => setOpen(false)}>
              <input type="search" name="q" placeholder="Rechercher…" className="field pl-9 rounded-full" />
              <Icon
                name="search"
                size={16}
                className="absolute left-7 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
              />
            </form>

            <div className="px-3 pb-4 flex flex-col gap-0.5">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
                Boutique
              </p>
              {VERTICAL_LIST.map((v) => (
                <Link
                  key={v.key}
                  href={`/${v.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                >
                  {v.label}
                  <Icon name="chevron-right" size={14} className="opacity-40" />
                </Link>
              ))}
              <Link
                href="/catalogue"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
              >
                Tout le catalogue
                <Icon name="chevron-right" size={14} className="opacity-40" />
              </Link>
              <Link
                href="/le-defaut"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
              >
                La grille du défaut
                <Icon name="chevron-right" size={14} className="opacity-40" />
              </Link>

              <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]">
                Mon espace
              </p>
              {isLoggedIn ? (
                <>
                  <Link
                    href={homeForRole(role ?? "CLIENT")}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                  >
                    <Icon name="grid" size={16} /> Tableau de bord
                  </Link>
                  <Link
                    href="/compte/commandes"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                  >
                    <Icon name="package" size={16} /> Mes commandes
                  </Link>
                  <Link
                    href="/compte/favoris"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                  >
                    <Icon name="heart" size={16} /> Mes favoris
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[var(--color-cream-deep)] text-sm font-medium"
                  >
                    <Icon name="message" size={16} /> Messages
                  </Link>
                  <a
                    href="/api/deconnexion"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-grade-c-bg)]"
                  >
                    <Icon name="logout" size={16} /> Se déconnecter
                  </a>
                </>
              ) : (
                <div className="px-3 pt-2 flex flex-col gap-2">
                  <Link href="/connexion" onClick={() => setOpen(false)} className="btn btn-outline w-full">
                    Se connecter
                  </Link>
                  <Link href="/inscription" onClick={() => setOpen(false)} className="btn btn-gold w-full">
                    Créer un compte
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
