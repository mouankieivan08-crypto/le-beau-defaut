"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import Logo from "./Logo";
import type { NavItem } from "./DashboardShell";

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

export default function DashboardNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  // L'élément le plus spécifique gagne (ex. /vendeur/annonces/nouvelle plutôt que /vendeur/annonces)
  const activeHref = items
    .filter((i) => isActive(pathname, i))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="px-3 flex flex-col gap-0.5">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? "bg-[var(--color-gold-dark)]/35 text-[var(--color-cream)] font-medium"
                : "text-[var(--color-cream)]/65 hover:bg-white/5 hover:text-[var(--color-cream)]"
            }`}
          >
            <Icon
              name={item.icon}
              size={17}
              className={active ? "text-[var(--color-gold-light)]" : "opacity-80"}
            />
            <span className="flex-1">{item.label}</span>
            {!!item.badge && item.badge > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-gold)] text-[var(--color-ink)] text-[10px] font-bold grid place-items-center">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNav({ items, roleLabel }: { items: NavItem[]; roleLabel: string }) {
  const [open, setOpen] = useState(false);
  const total = items.reduce((s, i) => s + (i.badge ?? 0), 0);

  return (
    <div className="lg:hidden sticky top-0 z-40 bg-[var(--color-ink)] text-[var(--color-cream)] no-print">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/" aria-label="Retour au site" className="flex items-center gap-2.5">
          <Logo size={30} variant="mark" onDark />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-gold-light)]">
            {roleLabel}
          </span>
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative h-10 w-10 grid place-items-center rounded-lg hover:bg-white/10"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          <Icon name={open ? "close" : "menu"} size={21} />
          {!open && total > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[var(--color-gold)]" />
          )}
        </button>
      </div>
      {open && (
        <div className="pb-4 border-t border-white/10 pt-3 max-h-[80vh] overflow-y-auto">
          <DashboardNav items={items} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
