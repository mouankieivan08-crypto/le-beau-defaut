import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeForRole } from "@/lib/constants";
import { RegisterForm } from "@/components/AuthForms";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <AuthShell
      title="Rejoindre Le Beau Défaut"
      subtitle="Achetez malin, ou donnez une seconde chance à votre stock."
    >
      <RegisterForm />
    </AuthShell>
  );
}
