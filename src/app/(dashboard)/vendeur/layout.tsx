import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";

export const metadata: Metadata = { title: { default: "Espace vendeur", template: "%s · Vendeur LBD" } };

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSeller("/vendeur");

  const [toShip, rejected, unreadThreads] = await Promise.all([
    prisma.order.count({
      where: { items: { some: { sellerId: user.id } }, status: { in: ["PAYEE", "CONFIRMEE"] } },
    }),
    prisma.product.count({ where: { sellerId: user.id, status: "REJETE" } }),
    prisma.notification.count({ where: { userId: user.id, type: "MESSAGE", isRead: false } }),
  ]);

  const nav: NavItem[] = [
    { href: "/vendeur", label: "Vue d'ensemble", icon: "chart", exact: true },
    { href: "/vendeur/annonces", label: "Mes annonces", icon: "tag", badge: rejected },
    { href: "/vendeur/annonces/nouvelle", label: "Nouvelle annonce", icon: "plus" },
    { href: "/vendeur/ventes", label: "Ventes", icon: "package", badge: toShip },
    { href: "/vendeur/paiements", label: "Versements", icon: "wallet" },
    { href: "/vendeur/boutique", label: "Ma boutique", icon: "home" },
    { href: "/messages", label: "Messages", icon: "message", badge: unreadThreads },
  ];

  return (
    <DashboardShell role="VENDEUR" user={user} nav={nav} subtitle={user.seller?.shopName}>
      {children}
    </DashboardShell>
  );
}
