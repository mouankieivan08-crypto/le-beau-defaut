import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import { Avatar } from "./ui";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/compte", label: "Vue d'ensemble", icon: "grid" },
  { href: "/compte/commandes", label: "Mes commandes", icon: "package" },
  { href: "/compte/favoris", label: "Mes favoris", icon: "heart" },
  { href: "/messages", label: "Messages", icon: "message" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/compte/profil", label: "Profil & adresse", icon: "settings" },
];

export default function AccountNav({
  active,
  user,
}: {
  active: string;
  user: { firstName: string; lastName: string; email: string; avatarUrl: string | null; role: string; seller?: unknown | null };
}) {
  const sells = user.role === "ADMIN" || Boolean(user.seller);
  return (
    <aside className="surface p-3 lg:sticky lg:top-[136px]">
      <div className="flex items-center gap-3 px-2 py-3 mb-2 border-b border-[var(--color-sand)]">
        <Avatar first={user.firstName} last={user.lastName} url={user.avatarUrl} size={40} />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[11px] text-[var(--color-ink-muted)] truncate">{user.email}</p>
        </div>
      </div>

      <nav className="flex lg:flex-col gap-0.5 overflow-x-auto no-scrollbar">
        {LINKS.map((l) => {
          const isActive = active === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[var(--color-ink)] text-[var(--color-cream)] font-medium"
                  : "text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)]"
              }`}
            >
              <Icon name={l.icon} size={16} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      {user.role !== "CLIENT" && (
        <Link
          href={user.role === "ADMIN" ? "/admin" : user.role === "VENDEUR" ? "/vendeur" : "/livreur"}
          className="btn btn-gold w-full mt-3 hidden lg:flex"
        >
          <Icon name="arrow-right" size={14} />
          {user.role === "ADMIN" ? "Administration" : user.role === "VENDEUR" ? "Espace vendeur" : "Espace livreur"}
        </Link>
      )}
    </aside>
  );
}

export function AccountLayout({
  active,
  user,
  children,
}: {
  active: string;
  user: { firstName: string; lastName: string; email: string; avatarUrl: string | null; role: string; seller?: unknown | null };
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-7 items-start">
      <AccountNav active={active} user={user} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
