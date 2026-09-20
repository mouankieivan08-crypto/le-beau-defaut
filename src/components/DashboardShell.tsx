import Link from "next/link";
import Logo from "./Logo";
import Icon, { type IconName } from "./Icon";
import { Avatar } from "./ui";
import DashboardNav, { DashboardMobileNav } from "./DashboardNav";
import { logoutAction } from "@/lib/actions/auth";
import { ROLES } from "@/lib/constants";

export type NavItem = { href: string; label: string; icon: IconName; badge?: number; exact?: boolean };

export default function DashboardShell({
  role,
  user,
  nav,
  children,
  subtitle,
}: {
  role: "ADMIN" | "VENDEUR" | "LIVREUR";
  user: { firstName: string; lastName: string; email: string; avatarUrl: string | null; role?: string };
  nav: NavItem[];
  subtitle?: string;
  children: React.ReactNode;
}) {
  const roleLabel = role === "ADMIN" ? "Administration" : role === "VENDEUR" ? "Espace vendeur" : "Espace livreur";

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-4">
        <Link href="/" className="block" aria-label="Retour au site">
          <Logo size={38} variant="full" onDark />
        </Link>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-gold-light)]">
          {roleLabel}
        </p>
        {subtitle && <p className="text-xs text-[var(--color-cream)]/55 mt-0.5 truncate">{subtitle}</p>}
      </div>

      <DashboardNav items={nav} />

      <div className="mt-auto p-4 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-cream)]/70 hover:bg-white/5 hover:text-[var(--color-cream)] mb-2"
        >
          <Icon name="home" size={16} /> Voir la boutique
        </Link>
        <div className="flex items-center gap-2.5 px-2">
          <Avatar first={user.firstName} last={user.lastName} url={user.avatarUrl} size={34} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-[var(--color-cream)]">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[11px] text-[var(--color-cream)]/50 truncate">{ROLES[(user.role ?? role) as keyof typeof ROLES]?.label ?? ROLES[role].label}</p>
          </div>
          <form action={logoutAction}>
            <button
              className="h-8 w-8 grid place-items-center rounded-lg text-[var(--color-cream)]/60 hover:bg-white/10 hover:text-[var(--color-cream)]"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <Icon name="logout" size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[256px_1fr] bg-[var(--color-cream)]">
      {/* Barre latérale (bureau) */}
      <aside className="hidden lg:block sticky top-0 h-screen overflow-y-auto bg-[var(--color-ink)] no-print">
        {sidebar}
      </aside>

      {/* Barre supérieure (mobile) */}
      <DashboardMobileNav items={nav} roleLabel={roleLabel} />

      <main className="min-w-0 px-4 sm:px-6 lg:px-9 py-6 lg:py-8">{children}</main>
    </div>
  );
}
