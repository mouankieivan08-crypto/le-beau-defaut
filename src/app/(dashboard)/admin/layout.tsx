import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import DashboardShell, { type NavItem } from "@/components/DashboardShell";
import { SUPPORT_PREFIX, REPORT_PREFIX } from "@/lib/constants";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Admin LBD" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin("/admin");

  const [pendingProducts, pendingSellers, pendingPayouts, toAssign, pendingAuth, openClaims] = await Promise.all([
    prisma.product.count({ where: { status: "EN_ATTENTE" } }),
    prisma.sellerProfile.count({ where: { status: "EN_ATTENTE" } }),
    prisma.payout.count({ where: { status: "EN_ATTENTE" } }),
    prisma.delivery.count({ where: { status: "A_ASSIGNER", order: { status: { notIn: ["ANNULEE", "EN_ATTENTE_PAIEMENT"] } } } }),
    prisma.product.count({ where: { vertical: "SACS", authenticity: "EN_COURS" } }),
    prisma.claim.count({ where: { status: { in: ["OUVERTE", "EN_EXAMEN"] } } }),
  ]);

  const resetsEnAttente = await prisma.passwordReset.count({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
  });

  const heldOrders = await prisma.order.count({ where: { escrowStatus: "SOUS_SEQUESTRE" } });
  const proofsToCheck = await prisma.order.count({
    where: { status: "EN_ATTENTE_PAIEMENT", paymentStatus: "EN_ATTENTE", paymentDeclaredAt: { not: null } },
  });

  const openSupport = await prisma.thread.count({
    where: {
      isClosed: false,
      OR: [{ subject: { startsWith: SUPPORT_PREFIX } }, { subject: { startsWith: REPORT_PREFIX } }],
    },
  });

  const nav: NavItem[] = [
    { href: "/admin", label: "Vue d'ensemble", icon: "chart", exact: true },
    { href: "/admin/verifications", label: "Paiements à confirmer", icon: "wallet", badge: proofsToCheck },
    { href: "/admin/commandes", label: "Commandes", icon: "package" },
    { href: "/admin/support", label: "Support & signalements", icon: "message", badge: openSupport },
    { href: "/admin/reclamations", label: "Réclamations", icon: "shield", badge: openClaims },
    { href: "/admin/livraisons", label: "Livraisons", icon: "truck", badge: toAssign },
    { href: "/admin/annonces", label: "Annonces", icon: "tag", badge: pendingProducts + pendingAuth },
    { href: "/admin/annonces/nouvelle", label: "Publier un article", icon: "plus" },
    { href: "/admin/vendeurs", label: "Vendeurs", icon: "wallet", badge: pendingSellers },
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users" },
    { href: "/admin/reinitialisations", label: "Mots de passe", icon: "shield", badge: resetsEnAttente },
    { href: "/admin/sequestre", label: "Séquestre", icon: "shield", badge: heldOrders },
    { href: "/admin/paiements", label: "Versements", icon: "wallet", badge: pendingPayouts },
    { href: "/admin/categories", label: "Catégories", icon: "grid" },
    { href: "/admin/parametres", label: "Paramètres", icon: "settings" },
    { href: "/admin/journal", label: "Journal d'activité", icon: "list" },
    { href: "/admin/profil", label: "Mon profil", icon: "users" },
  ];

  return (
    <DashboardShell role="ADMIN" user={user} nav={nav} subtitle="Le Beau Défaut · Congo">
      {children}
    </DashboardShell>
  );
}
