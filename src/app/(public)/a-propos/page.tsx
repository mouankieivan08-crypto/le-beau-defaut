import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";
import Icon, { type IconName } from "@/components/Icon";
import { Breadcrumb } from "@/components/ui";

export const metadata: Metadata = { title: "Notre histoire" };

const VALUES: { icon: IconName; title: string; text: string }[] = [
  { icon: "eye", title: "Transparence", text: "On montre le défaut avant le reste. Un acheteur bien informé ne revient jamais déçu." },
  { icon: "tag", title: "Juste prix", text: "La remise découle du défaut, pas de l'humeur du vendeur. La grille est la même pour tous." },
  { icon: "refresh", title: "Seconde chance", text: "Chaque meuble revendu, c'est un meuble qui ne finit pas au rebut ni au fond d'un dépôt." },
  { icon: "users", title: "Local", text: "Des entreprises congolaises, des livreurs de Brazzaville, des acheteurs d'ici." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Notre histoire" }]} />

      <header className="text-center mb-12">
        <Logo variant="lockup" size={140} />
      </header>

      <article className="surface p-8 sm:p-12 mb-10">
        <h1 className="font-display text-[34px] font-bold leading-tight mb-5">Pourquoi « Le Beau Défaut » ?</h1>
        <div className="text-[16px] text-[var(--color-ink-soft)] leading-[1.8] flex flex-col gap-4">
          <p>
            Au Congo, une grande partie du mobilier est importée. Entre le port, le camion et le dépôt, il arrive qu&apos;un
            canapé se raye, qu&apos;un carton s&apos;écrase, qu&apos;une table prenne un coup. Invendables au prix du neuf, ces
            pièces restent des mois dans les réserves des magasins.
          </p>
          <p>
            De l&apos;autre côté, des familles, des jeunes actifs, des hôtels et des bureaux cherchent du beau mobilier sans
            payer le prix du neuf. Ils se moquent d&apos;une rayure sous un accoudoir — à condition de le savoir avant.
          </p>
          <p>
            Le Beau Défaut fait le lien. Nous reprenons les meubles, nous photographions leur défaut, nous le notons sur une
            grille claire, et nous les revendons à un prix qui en tient compte. Le but est simple : donner une seconde vie à
            des pièces encore belles, sans masquer la réalité du défaut.
          </p>
          <p className="font-script text-gilded text-3xl text-center pt-4">Les petits défauts font de grandes économies.</p>
        </div>
      </article>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {VALUES.map((v) => (
          <div key={v.title} className="surface p-6">
            <Icon name={v.icon} size={22} className="text-[var(--color-gold-deep)] mb-3" />
            <h2 className="font-display text-lg font-bold">{v.title}</h2>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1 leading-relaxed">{v.text}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/catalogue" className="btn btn-primary btn-lg">
          Découvrir le catalogue
        </Link>
        <Link href="/vendre" className="btn btn-outline btn-lg">
          Vendre votre stock
        </Link>
      </div>
    </div>
  );
}
