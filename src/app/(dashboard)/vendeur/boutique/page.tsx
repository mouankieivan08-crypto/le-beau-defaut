import Link from "next/link";
import type { Metadata } from "next";
import { requireSeller } from "@/lib/auth";
import { CITIES, SELLER_STATUS } from "@/lib/constants";
import { updateShopAction } from "@/lib/actions/seller";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";
import { PageHeader, Card, Badge, EmptyState, Avatar } from "@/components/ui";
import PhotoInput from "@/components/PhotoInput";

export const metadata: Metadata = { title: "Ma boutique" };

export default async function ShopPage() {
  const user = await requireSeller("/vendeur/boutique");
  const shop = user.seller;

  if (!shop) {
    return (
      <>
        <PageHeader title="Ma boutique" />
        <EmptyState icon="home" title="Aucune boutique associée à ce compte" />
      </>
    );
  }

  const completeness = [shop.description, shop.rccm, shop.niu, shop.contactPhone, shop.address, shop.mobileMoney, shop.logoUrl].filter(Boolean).length;
  const pct = Math.round((completeness / 7) * 100);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Ma boutique"
        subtitle="Ces informations rassurent les acheteurs et accélèrent la validation."
        action={
          <div className="flex items-center gap-2">
            <Badge tone={SELLER_STATUS[shop.status].tone}>{SELLER_STATUS[shop.status].label}</Badge>
            <Link href={`/boutique/${shop.shopSlug}`} className="btn btn-outline btn-sm" target="_blank">
              <Icon name="eye" size={13} /> Page publique
            </Link>
          </div>
        }
      />

      <Card className="mb-5">
        <div className="flex items-center gap-4">
          <Avatar first={shop.shopName} last="" url={shop.logoUrl} size={56} />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold">Profil complété à {pct} %</p>
              <p className="text-xs text-[var(--color-ink-muted)]">{completeness}/7 informations</p>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-cream-deep)]">
              <div className="h-2 rounded-full bg-[var(--color-gold)]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <ActionForm action={updateShopAction} submitLabel="Enregistrer la boutique" submitClassName="btn btn-gold">
          <div className="flex flex-col gap-6">
            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="font-display text-lg font-bold mb-3 sm:col-span-2">Identité</legend>
              <Field label="Nom de la boutique" id="shopName">
                <input id="shopName" name="shopName" defaultValue={shop.shopName} className="field" required />
              </Field>
              <Field label="Ville" id="city">
                <select id="city" name="city" defaultValue={shop.city} className="field">
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Présentation" id="description">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={shop.description ?? ""}
                    className="field"
                    placeholder="Votre activité, depuis quand, d'où viennent les articles à petit défaut…"
                  />
                </Field>
              </div>
              <Field label="Logo (fichier)" id="logo">
                <PhotoInput id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
              </Field>
              <Field label="…ou lien du logo" id="logoUrl">
                <input id="logoUrl" name="logoUrl" defaultValue={shop.logoUrl ?? ""} className="field" placeholder="https://…" />
              </Field>
            </fieldset>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="font-display text-lg font-bold mb-3 sm:col-span-2">Coordonnées</legend>
              <Field label="Téléphone de contact" id="contactPhone">
                <input id="contactPhone" name="contactPhone" defaultValue={shop.contactPhone ?? ""} className="field" required />
              </Field>
              <Field label="Adresse du dépôt" id="address">
                <input id="address" name="address" defaultValue={shop.address ?? ""} className="field" />
              </Field>
            </fieldset>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="font-display text-lg font-bold mb-1 sm:col-span-2">Informations légales</legend>
              <p className="text-xs text-[var(--color-ink-muted)] sm:col-span-2 -mt-1 mb-1">
                Obligatoires pour les entreprises. Non affichées publiquement.
              </p>
              <Field label="RCCM" id="rccm">
                <input id="rccm" name="rccm" defaultValue={shop.rccm ?? ""} className="field" placeholder="CG-BZV-01-…" />
              </Field>
              <Field label="NIU" id="niu">
                <input id="niu" name="niu" defaultValue={shop.niu ?? ""} className="field" />
              </Field>
            </fieldset>

            <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <legend className="font-display text-lg font-bold mb-3 sm:col-span-2">Versements</legend>
              <Field label="Opérateur" id="mobileMoneyOp">
                <select id="mobileMoneyOp" name="mobileMoneyOp" defaultValue={shop.mobileMoneyOp ?? "MTN"} className="field">
                  <option value="MTN">MTN Mobile Money</option>
                  <option value="AIRTEL">Airtel Money</option>
                </select>
              </Field>
              <Field label="Numéro de versement" id="mobileMoney">
                <input id="mobileMoney" name="mobileMoney" defaultValue={shop.mobileMoney ?? ""} className="field" />
              </Field>
            </fieldset>
          </div>
        </ActionForm>
      </Card>

      <p className="text-xs text-[var(--color-ink-muted)] mt-4">
        Commission Le Beau Défaut : <strong>{shop.commissionPct} %</strong> du prix de vente, prélevée uniquement sur les
        ventes livrées.
      </p>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
