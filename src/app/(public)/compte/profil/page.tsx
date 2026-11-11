import type { Metadata } from "next";
import { requireClientSpace } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { dateFR } from "@/lib/format";
import { AccountLayout } from "@/components/AccountNav";
import { ProfileForm, PasswordForm } from "@/components/ProfileForms";
import { Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireClientSpace("/compte/profil", "/admin/profil");

  return (
    <AccountLayout active="/compte/profil" user={user}>
      <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
        <h1 className="font-display text-[28px] font-bold">Profil & sécurité</h1>
        <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-2">
          <Badge tone="warning">{ROLES[user.role as keyof typeof ROLES]?.label ?? user.role}</Badge>
          Membre depuis le {dateFR(user.createdAt)}
        </p>
      </div>
      <div className="flex flex-col gap-5">
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
    </AccountLayout>
  );
}
