import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeForRole } from "@/lib/constants";
import { LoginForm } from "@/components/AuthForms";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next && next.startsWith("/") ? next : homeForRole(user.role));

  return (
    <AuthShell title="Bon retour parmi nous" subtitle="Connectez-vous pour retrouver vos favoris, vos commandes et votre boutique.">
      <LoginForm next={next} />
    </AuthShell>
  );
}
