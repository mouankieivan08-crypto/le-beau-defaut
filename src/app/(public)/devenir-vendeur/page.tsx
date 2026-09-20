import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { becomeSellerAction } from "@/lib/actions/seller";
import { CITIES, ESCROW_RELEASE_DAYS, DEFAULT_COMMISSION_PCT } from "@/lib/constants";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";
import { PageHeader, Alert, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Ouvrir une boutique",
  description: "Vendez vos articles à petit défaut sur Le Beau Défaut : paiement sécurisé, acheteurs vérifiés.",
};

const SELLER_TYPES = [
  { key: "PARTICULIER", label: "Particulier", hint: "Je vide ma maison, je revends quelques pièces." },
  { key: "ENTREPRISE", label: "Entreprise", hint: "Boutique, showroom, atelier, importateur." },
  { key: "DEPOT_VENTE", label: "Dépôt-vente", hint: "Je vends pour le compte d'autres personnes." },
];

export default async function BecomeSellerPage() {
  const user = await requireUser("/devenir-vendeur");
  if (user.seller) redirect("/vendeur");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <PageHeader
        title="Ouvrir une boutique"
        subtitle="Votre compte reste le même : vous continuez à acheter, et l'espace vente s'ajoute à côté."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card>
          <Icon name="shield" size={18} className="text-[var(--color-gold-dark)] mb-2" />
          <p className="text-sm font-semibold mb-1">Vous êtes payé</p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            L'acheteur paie Le Beau Défaut. Nous gardons la somme et vous la versons après la livraison.
          </p>
        </Card>
        <Card>
          <Icon name="message" size={18} className="text-[var(--color-gold-dark)] mb-2" />
          <p className="text-sm font-semibold mb-1">Pas de démarchage</p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Les échanges passent par la messagerie : ni votre numéro, ni celui de l'acheteur ne circulent.
          </p>
        </Card>
        <Card>
          <Icon name="wallet" size={18} className="text-[var(--color-gold-dark)] mb-2" />
          <p className="text-sm font-semibold mb-1">{DEFAULT_COMMISSION_PCT} % de commission</p>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Prélevés seulement quand la vente aboutit. Publier ne coûte rien.
          </p>
        </Card>
      </div>

      <div className="mb-6">
        <Alert tone="info">
          <strong>Ce que vous pouvez vendre ici : le fourre-tout.</strong> Déco, électroménager, luminaires,
          petits meubles d'appoint… Le mobilier et les sacs de luxe, eux, nous les achetons avant de les
          revendre nous-mêmes —{" "}
          <Link href="/vendre" className="underline underline-offset-2">
            proposez-nous votre lot
          </Link>
          .
        </Alert>
      </div>

      <div className="surface p-5 md:p-7">
        <ActionForm action={becomeSellerAction} submitLabel="Ouvrir ma boutique" pendingLabel="Enregistrement…">
          <div className="flex flex-col gap-4">
            <div>
              <label className="label" htmlFor="shopName">
                Nom de la boutique
              </label>
              <input
                id="shopName"
                name="shopName"
                className="field"
                required
                minLength={2}
                placeholder="Ex. Chez Clarisse — déco Poto-Poto"
              />
              <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">
                C'est ce nom que les acheteurs verront sur vos annonces.
              </p>
            </div>

            <fieldset>
              <legend className="label mb-2">Qui vend ?</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SELLER_TYPES.map((t, i) => (
                  <label
                    key={t.key}
                    className="flex flex-col gap-1 p-3 rounded-xl border border-[var(--color-sand)] cursor-pointer hover:bg-[var(--color-cream-deep)] has-[:checked]:border-[var(--color-gold-dark)] has-[:checked]:bg-[var(--color-gold-pale)]"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <input type="radio" name="type" value={t.key} defaultChecked={i === 0} className="accent-[var(--color-gold-dark)]" />
                      {t.label}
                    </span>
                    <span className="text-[11px] text-[var(--color-ink-muted)] pl-6">{t.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="city">
                  Ville
                </label>
                <select id="city" name="city" className="field" defaultValue={user.city ?? "Brazzaville"}>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="contactPhone">
                  Téléphone (pour nous, pas pour les acheteurs)
                </label>
                <input
                  id="contactPhone"
                  name="contactPhone"
                  className="field"
                  required
                  defaultValue={user.phone ?? ""}
                  placeholder="06 123 45 67"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="mobileMoney">
                  Numéro Mobile Money (pour être payé)
                </label>
                <input id="mobileMoney" name="mobileMoney" className="field" placeholder="06 123 45 67" />
              </div>
              <div>
                <label className="label" htmlFor="mobileMoneyOp">
                  Opérateur
                </label>
                <select id="mobileMoneyOp" name="mobileMoneyOp" className="field" defaultValue="">
                  <option value="">À préciser plus tard</option>
                  <option value="MTN">MTN MoMo</option>
                  <option value="AIRTEL">Airtel Money</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="description">
                En deux phrases, ce que vous vendez
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="field"
                placeholder="D'où viennent vos articles, pourquoi ils ont un petit défaut, ce que vous proposez habituellement."
              />
            </div>

            <p className="text-xs text-[var(--color-ink-muted)]">
              En ouvrant une boutique, vous acceptez la règle du jeu : le défaut est photographié et décrit,
              les échanges restent sur la plateforme, et l'argent vous est versé {ESCROW_RELEASE_DAYS} jours
              après la livraison si l'acheteur n'a rien signalé.
            </p>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
