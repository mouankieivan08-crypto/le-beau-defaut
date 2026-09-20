import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";

export const metadata: Metadata = { title: { default: "Espace livreur", template: "%s · Livreur LBD" } };

export default async function CourierLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["LIVREUR", "ADMIN"], "/livreur");

  const active = user.courier
    ? await prisma.delivery.count({
        where: { courierId: user.courier.id, status: { in: ["ASSIGNEE", "RECUPEREE", "EN_ROUTE"] } },
      })
    : 0;

  const nav: NavItem[] = [
    { href: "/livreur", label: "Mes courses", icon: "truck", badge: active, exact: true },
    { href: "/livreur/historique", label: "Historique & gains", icon: "list" },
    { href: "/livreur/profil", label: "Véhicule & zones", icon: "settings" },
  ];

  return (
    <DashboardShell role="LIVREUR" user={user} nav={nav} subtitle={user.courier?.zones.replace(/;/g, " · ")}>
      {children}
    </DashboardShell>
  );
}
