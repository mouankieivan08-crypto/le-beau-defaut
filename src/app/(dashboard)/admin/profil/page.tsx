import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { ProfileForm, PasswordForm } from "@/components/ProfileForms";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Mon profil" };

/** Profil de l'administrateur connecté : nom, téléphone, e-mail de connexion et mot de passe. */
export default async function AdminProfilePage() {
  const user = await requireAdmin("/admin/profil");

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Vos informations et votre adresse e-mail de connexion." />
      <div className="flex flex-col gap-5 max-w-3xl">
        <ProfileForm
          profile={{
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            city: user.city,
            quartier: user.quartier,
            email: user.email,
          }}
        />
        <PasswordForm />
      </div>
    </>
  );
}
