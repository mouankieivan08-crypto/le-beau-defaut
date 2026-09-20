import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import Icon, { type IconName } from "@/components/Icon";
import { Breadcrumb, GradeBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Vendre votre stock",
  description: "Entreprises de mobilier, showrooms, dépôts-ventes : écoulez vos articles à petit défaut avec Le Beau Défaut.",
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "home", title: "Ouvrez votre boutique", text: "Inscription gratuite. Nous vérifions votre RCCM et votre NIU sous 24 h ouvrées." },
  { icon: "camera", title: "Photographiez le défaut", text: "Une vue d'ensemble, un gros plan du défaut. Le formulaire vous guide pour le grade et le prix." },
  { icon: "check-circle", title: "Nous validons", text: "Notre équipe vérifie la cohérence défaut / photos / remise, puis publie l'annonce." },
  { icon: "truck", title: "Nous livrons", text: "Nos livreurs récupèrent l'article chez vous et encaissent si le client paie en espèces." },
  { icon: "wallet", title: "Vous êtes payé", text: "Versement Mobile Money après chaque livraison, commission déduite. Aucun frais fixe." },
];

export default async function SellPage() {
  const [sellers, sold, gmv] = await Promise.all([
    prisma.sellerProfile.count({ where: { status: "ACTIF" } }),
    prisma.orderItem.aggregate({ where: { order: { status: "LIVREE" } }, _sum: { quantity: true } }),
    prisma.orderItem.aggregate({ where: { order: { status: "LIVREE" } }, _sum: { sellerAmount: true } }),
  ]);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Vendre avec nous" }]} />

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center mb-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-deep)] mb-2">Pour les professionnels</p>
          <h1 className="font-display text-[40px] sm:text-[48px] font-bold leading-[1.05]">
            Votre stock abîmé
            <br />
            vaut plus que vous ne pensez.
          </h1>
          <p className="text-[16px] text-[var(--color-ink-soft)] mt-5 leading-relaxed max-w-xl">
            Un canapé griffé au déchargement du conteneur, une table de showroom, un lot de chaises en fin de série : ces
            articles immobilisent votre trésorerie et votre surface de dépôt. Nous les mettons devant des acheteurs qui
            cherchent précisément ça.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/inscription?type=vendeur" className="btn btn-gold btn-lg">
              Ouvrir ma boutique gratuitement
            </Link>
            <Link href="/le-defaut" className="btn btn-outline btn-lg">
              Voir la grille du défaut
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { v: String(sellers), l: "boutiques partenaires" },
            { v: String(sold._sum.quantity ?? 0), l: "articles écoulés" },
            { v: money(gmv._sum.sellerAmount ?? 0), l: "reversés aux vendeurs" },
            { v: "0 F", l: "d'abonnement" },
          ].map((s) => (
            <div key={s.l} className="surface p-5">
              <p className="text-2xl font-semibold tracking-tight">{s.v}</p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-[30px] font-bold mb-6">Comment ça marche</h2>
        <ol className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="surface p-5 relative">
              <span className="absolute top-3 right-4 font-display text-3xl font-bold text-[var(--color-sand)]">{i + 1}</span>
              <Icon name={s.icon} size={22} className="text-[var(--color-gold-deep)] mb-3" />
              <h3 className="font-display font-bold leading-snug">{s.title}</h3>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="surface p-7">
          <h2 className="font-display text-2xl font-bold">Une commission simple</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-5">Prélevée uniquement sur les ventes livrées.</p>
          <ul className="flex flex-col gap-3">
            {[
              ["Mobilier & fourre-tout", "15 %"],
              ["Sacs de luxe (avec authentification)", "20 %"],
              ["Électroménager en volume", "Sur devis"],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between items-baseline border-b border-[var(--color-sand)] pb-2.5">
                <span>{k}</span>
                <span className="font-semibold">{v}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-ink-muted)] mt-4">
            Exemple : un canapé vendu 590 000 FCFA vous rapporte 501 500 FCFA, livraison organisée par nos soins.
          </p>
        </div>

        <div className="surface p-7">
          <h2 className="font-display text-2xl font-bold">Ce que nous acceptons</h2>
          <ul className="flex flex-col gap-3 mt-5">
            {(["A", "B", "C"] as const).map((g) => (
              <li key={g} className="flex gap-3">
                <GradeBadge grade={g} />
                <span className="text-sm text-[var(--color-ink-soft)]">
                  {g === "A" && "Fins de série, retours clients, emballages abîmés, micro-défauts."}
                  {g === "B" && "Taches légères, décolorations, bosses discrètes, modèles d'exposition soignés."}
                  {g === "C" && "Défauts francs mais article fonctionnel : accrocs, pièces manquantes, usure nette."}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm mt-5 flex gap-2 text-[var(--color-danger)]">
            <Icon name="alert" size={16} className="shrink-0 mt-0.5" />
            Nous refusons : articles cassés ou dangereux, literie usagée, contrefaçons.
          </p>
        </div>
      </section>

      <section className="rounded-[18px] bg-[var(--color-ink)] text-[var(--color-cream)] p-10 text-center">
        <p className="font-script text-gilded text-3xl">Un défaut n&apos;est pas une perte</p>
        <h2 className="font-display text-[30px] font-bold mt-2">C&apos;est une vente à trouver.</h2>
        <Link href="/inscription?type=vendeur" className="btn btn-gold btn-lg mt-6">
          Commencer maintenant
        </Link>
      </section>
    </div>
  );
}
