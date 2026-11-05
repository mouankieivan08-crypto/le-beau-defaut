import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VERTICAL_LIST, homeForRole } from "@/lib/constants";
import Logo from "./Logo";
import Icon from "./Icon";
import { Avatar } from "./ui";
import MobileMenu from "./MobileMenu";
import { logoutAction } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Header() {
  const user = await getCurrentUser();

  const [cartCount, favCount, notifCount] = user
    ? await Promise.all([
        prisma.cartItem.aggregate({ where: { userId: user.id }, _sum: { quantity: true } }),
        prisma.favorite.count({ where: { userId: user.id } }),
        prisma.notification.count({ where: { userId: user.id, isRead: false } }),
      ])
    : [null, 0, 0];

  const cartQty = cartCount?._sum.quantity ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-sand)] bg-[var(--color-cream)]/92 backdrop-blur-md no-print">
      {/* Bandeau signature */}
      <div className="bg-[var(--color-ink)] text-[var(--color-cream)]">
        <div className="mx-auto max-w-[1280px] px-4 py-1.5 flex items-center justify-center gap-2 text-center">
          <Icon name="sparkle" size={12} className="text-[var(--color-gold-light)]" />
          <p className="font-script text-[15px] leading-none text-[var(--color-gold-light)]">
            Les petits défauts font de grandes économies
          </p>
          <Icon name="sparkle" size={12} className="text-[var(--color-gold-light)]" />
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4">
        <div className="flex h-[68px] items-center gap-4">
          <Link href="/" className="shrink-0" aria-label="Le Beau Défaut — accueil">
            <span className="hidden sm:block">
              <Logo size={46} variant="full" />
            </span>
            <span className="sm:hidden">
              <Logo size={42} variant="mark" />
            </span>
          </Link>

          {/* Recherche */}
          <form action="/catalogue" className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="search"
              name="q"
              placeholder="Canapé, table, lampe…"
              className="field pl-9 rounded-full"
              aria-label="Rechercher un article"
            />
            <Icon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]"
            />
          </form>

          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            <Link href="/catalogue" className="px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-gold-dark)] transition-colors rounded-lg">
              Catalogue
            </Link>
            <Link
              href="/le-defaut"
              className="px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-gold-dark)] transition-colors"
            >
              La grille du défaut
            </Link>
          </nav>

          <div className="flex items-center gap-1 ml-auto lg:ml-0">
            <ThemeToggle />
            {user && (
              <Link
                href="/notifications"
                className="btn btn-ghost relative !px-2.5"
                aria-label={`Notifications${notifCount ? ` (${notifCount} non lues)` : ""}`}
              >
                <Icon name="bell" size={19} />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-[var(--color-danger)] text-white text-[9px] font-bold grid place-items-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Link>
            )}

            <Link href="/compte/favoris" className="btn btn-ghost relative !px-2.5" aria-label="Favoris">
              <Icon name="heart" size={19} />
              {favCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-[var(--color-gold)] text-white text-[9px] font-bold grid place-items-center">
                  {favCount}
                </span>
              )}
            </Link>

            <Link href="/panier" className="btn btn-ghost relative !px-2.5" aria-label="Panier">
              <Icon name="cart" size={19} />
              {cartQty > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] text-[9px] font-bold grid place-items-center">
                  {cartQty}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group hidden sm:block">
                <Link href={homeForRole(user.role)} className="btn btn-ghost !px-1.5 !py-1.5">
                  <Avatar first={user.firstName} last={user.lastName} url={user.avatarUrl} size={32} />
                  <Icon name="chevron-down" size={13} className="opacity-50" />
                </Link>
                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all absolute right-0 top-full pt-2 w-60">
                  <div className="surface p-2">
                    <div className="px-3 py-2 border-b border-[var(--color-sand)] mb-1">
                      <p className="text-sm font-semibold truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-[var(--color-ink-muted)] truncate">{user.email}</p>
                    </div>
                    <Link href={homeForRole(user.role)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-cream-deep)]">
                      <Icon name="grid" size={15} /> Mon tableau de bord
                    </Link>
                    <Link href="/compte/commandes" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-cream-deep)]">
                      <Icon name="package" size={15} /> Mes commandes
                    </Link>

                    {/* Un seul compte, deux espaces : on achète et on vend sans se déconnecter. */}
                    <div className="border-t border-[var(--color-sand)] my-1 pt-1">
                      <Link href="/compte" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-cream-deep)]">
                        <Icon name="cart" size={15} /> Espace achat
                      </Link>
                    </div>
                    <Link href="/messages" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-cream-deep)]">
                      <Icon name="message" size={15} /> Messages
                    </Link>
                    <Link href="/compte/profil" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm hover:bg-[var(--color-cream-deep)]">
                      <Icon name="settings" size={15} /> Mon profil
                    </Link>
                    <form action={logoutAction} className="border-t border-[var(--color-sand)] mt-1 pt-1">
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-danger)] hover:bg-[var(--color-grade-c-bg)]">
                        <Icon name="logout" size={15} /> Se déconnecter
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-1">
                <Link href="/connexion" className="btn btn-ghost btn-sm">
                  Connexion
                </Link>
                <Link href="/inscription" className="btn btn-primary btn-sm">
                  Créer un compte
                </Link>
              </div>
            )}

            <MobileMenu isLoggedIn={!!user} role={user?.role ?? null} canSell={Boolean(user?.seller) || user?.role === "ADMIN"} />
          </div>
        </div>
      </div>
    </header>
  );
}
