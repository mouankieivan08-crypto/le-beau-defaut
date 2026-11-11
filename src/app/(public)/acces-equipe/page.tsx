import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeForRole } from "@/lib/constants";
import { LoginForm } from "@/components/AuthForms";
import AuthShell from "@/components/AuthShell";

/**
 * Entrée de l'équipe : administration, boutique maison, livreurs.
 * Cette adresse n'est liée nulle part sur le site et n'est pas indexée.
 */
export const metadata: Metadata = {
  title: "Accès équipe",
  robots: { index: false, follow: false },
};

export default async function TeamAccessPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next && next.startsWith("/") ? next : homeForRole(user.role));

  return (
    <AuthShell
      title="Accès équipe"
      subtitle="Administration et livraisons. Cette page ne s'adresse pas aux clients."
    >
      <LoginForm next={next} team />
    </AuthShell>
  );
}
