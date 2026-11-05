import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { money, waLink } from "@/lib/format";
import Icon, { type IconName } from "@/components/Icon";
import { Breadcrumb, GradeBadge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Vendre avec nous",
  description: "Nous rachetons votre mobilier à petit défaut et vous aidons à le revendre avec transparence, prix net et livraison claire.",
};

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "home", title: "Ouvrez votre boutique", text: "Gratuit, depuis votre compte habituel. Nous vérifions votre boutique sous 24 h ouvrées." },
  { icon: "camera", title: "Photographiez le défaut", text: "Une vue d'ensemble, un gros plan du défaut. Le formulaire vous guide pour le grade et le prix." },
  { icon: "check-circle", title: "Nous validons", text: "Notre équipe vérifie la cohérence défaut / photos / remise, puis publie l'annonce." },
  { icon: "truck", title: "Nous livrons", text: "Nos livreurs récupèrent l'article chez vous et encaissent si le client paie en espèces." },
  { icon: "wallet", title: "Vous êtes payé", text: "L'acheteur paie Le Beau Défaut, qui vous verse la somme dès la réception confirmée — au plus tard 3 jours après la livraison." },
];

export default async function SellPage() {
  const contact = await prisma.setting.findUnique({ where: { key: "contact.whatsapp" } });
  const lotLink = waLink(
    contact?.value,
    "Bonjour, j'ai du mobilier (ou des sacs) à petit défaut à vous proposer. Voici ce que j'ai :"
  );

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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-deep)] mb-2">Vendre avec nous</p>
          <h1 className="font-display text-[40px] sm:text-[48px] font-bold leading-[1.05]">
            Deux façons
            <br />
            de vendre votre défaut.
          </h1>
          <p className="text-[16px] text-[var(--color-ink-soft)] mt-5 leading-relaxed max-w-xl">
            Nous <strong>rachetons votre mobilier</strong> à petit défaut, puis nous le revendons avec une vraie
            transparence sur le défaut, la remise et le prix final. Vous gagnez du temps, et l&apos;article trouve
            immédiatement un client sérieux.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
            <div className="surface p-4 border-[var(--color-gold)]/50">
              <p className="text-sm font-semibold flex items-center gap-2 mb-1">
                <Icon name="sparkle" size={15} className="text-[var(--color-gold-dark)]" /> Mobilier à petit défaut
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mb-3">
                Entreprise, showroom, importateur : nous venons voir le lot et vous faisons une offre ferme.
              </p>
              {lotLink ? (
                <a href={lotLink} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm w-full">
                  Proposer mon lot
                </a>
              ) : (
                <Link href="/aide" className="btn btn-gold btn-sm w-full">
                  Nous contacter
                </Link>
              )}
            </div>
            <div className="surface p-4">
              <p className="text-sm font-semibold flex items-center gap-2 mb-1">
                <Icon name="box" size={15} className="text-[var(--color-gold-dark)]" /> Mobilier en lots
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mb-3">
                Canapés, tables, chaises, rangements, fauteuils et autres pièces de maison : nous évaluons votre stock.
              </p>
              <Link href="/devenir-vendeur" className="btn btn-primary btn-sm w-full">
                Faire une demande
              </Link>
            </div>
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
              ["Mobilier critique / fin de série", "15 %"],
              ["Mobilier de grande pièce ou lot volumineux", "Sur devis"],
              ["Mobilier premium / showroom", "20 %"],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between items-baseline border-b border-[var(--color-sand)] pb-2.5">
                <span>{k}</span>
                <span className="font-semibold">{v}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-ink-muted)] mt-4">
            Exemple : un canapé vendu 590 000 FCFA vous rapporte 501 500 FCFA, livraison et vérification incluses.
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
        <Link href="/devenir-vendeur" className="btn btn-gold btn-lg mt-6">
          Commencer maintenant
        </Link>
      </section>
    </div>
  );
}
