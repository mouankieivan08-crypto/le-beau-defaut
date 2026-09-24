"use client";

import { useState } from "react";
import Icon from "./Icon";

/**
 * Les filtres, repliés sur téléphone.
 *
 * Sur un écran de 375 px, une colonne de filtres dépliée repousse les articles
 * hors de l'écran : on la referme derrière un bouton qui annonce le nombre de
 * critères actifs. Sur ordinateur, la colonne reste visible en permanence.
 */
export default function FilterDrawer({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:contents">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="btn btn-outline w-full lg:hidden mb-3 justify-between"
      >
        <span className="inline-flex items-center gap-2">
          <Icon name="filter" size={15} />
          Filtrer et trier
          {count > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] text-[10px] font-bold grid place-items-center">
              {count}
            </span>
          )}
        </span>
        <Icon name="chevron-down" size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      <aside className={`surface p-5 lg:sticky lg:top-[136px] ${open ? "" : "hidden lg:block"}`}>{children}</aside>
    </div>
  );
}
