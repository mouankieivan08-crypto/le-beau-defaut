import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { money, waLink } from "@/lib/format";
import Icon from "@/components/Icon";
import { Breadcrumb } from "@/components/ui";

export const metadata: Metadata = { title: "Aide & livraison" };

const FAQ: { q: string; a: string }[] = [
  {
    q: "Qui me vend l'article : Le Beau Défaut ou un particulier ?",
    a: "Les deux existent, et c'est écrit sur chaque annonce. Le mobilier et les sacs de luxe nous appartiennent : nous les rachetons aux entreprises, nous les inspectons et nous les vendons nous-mêmes (mention « Notre stock »). Le fourre-tout est une place de marché : l'article appartient à un vendeur, nous mettons en relation et nous sécurisons le paiement.",
  },
  {
    q: "Dans le fourre-tout, comment mon argent est-il protégé ?",
    a: "Vous payez Le Beau Défaut, pas le vendeur. Nous conservons la somme jusqu'à la livraison. Vous confirmez la réception d'un clic et le vendeur est payé ; sans nouvelles de votre part, il l'est automatiquement 3 jours après la livraison. Si l'article ne correspond pas, ouvrez une réclamation dans ces 3 jours : l'argent reste bloqué le temps que nous tranchions.",
  },
  {
    q: "Pourquoi mon numéro a-t-il été masqué dans la messagerie ?",
    a: "Parce que c'est ce qui vous protège. Une vente conclue par téléphone échappe au séquestre et à la réclamation : si l'article est faux ou n'arrive jamais, personne ne peut vous rembourser. Les numéros, adresses e-mail et liens sont donc retirés automatiquement des conversations entre particuliers.",
  },
  {
    q: "Puis-je acheter et vendre avec le même compte ?",
    a: "Oui. Depuis votre compte, « Ouvrir une boutique » ajoute un espace vente à côté de votre espace achat. Vous passez de l'un à l'autre par le menu de votre profil, sans vous déconnecter.",
  },
  {
    q: "J'ai du mobilier ou des sacs de luxe à vendre. Comment faire ?",
    a: "Ces deux rayons ne sont pas ouverts aux vendeurs extérieurs : nous achetons le lot, puis nous le revendons nous-mêmes. Écrivez-nous depuis la page « Vendre avec nous » ; nous venons voir les pièces et nous vous faisons une offre.",
  },
  {
    q: "Le défaut sera-t-il vraiment celui de la photo ?",
    a: "Oui. Chaque défaut est photographié, situé et noté avant publication, et notre équipe vérifie l'annonce. Si vous recevez un article avec un défaut non annoncé, signalez-le sous 3 jours : nous le reprenons et vous remboursons.",
  },
  {
    q: "Comment payer ?",
    a: "Par MTN Mobile Money ou Airtel Money au moment de la commande, ou en espèces au livreur. Les entreprises peuvent payer par virement.",
  },
  {
    q: "Combien coûte la livraison et combien de temps prend-elle ?",
    a: "Le tarif dépend du quartier (voir le tableau ci-dessous). Comptez 24 à 72 h dans Brazzaville. Le livreur vous appelle avant de passer.",
  },
  {
    q: "Le livreur monte-t-il les meubles ?",
    a: "Pour les meubles livrés démontés (lits, tables, rangements), le montage simple est proposé sur demande dans les instructions de commande.",
  },
  {
    q: "Puis-je annuler ma commande ?",
    a: "Oui, depuis votre espace « Mes commandes », tant que le colis n'a pas été récupéré par le livreur. Un paiement Mobile Money est remboursé sous 48 h.",
  },
  {
    q: "Les sacs de luxe sont-ils authentiques ?",
    a: "Les sacs portant le badge « Authentifié LBD » ont été contrôlés par notre équipe : coutures, ferrures, numéro de série, facture ou certificat quand il existe. Les autres sont clairement indiqués « non vérifié ».",
  },
  {
    q: "Le prix est-il négociable ?",
    a: "Seulement quand l'annonce l'indique (« Prix négociable »). Utilisez alors le bouton « Poser une question » pour échanger avec le vendeur.",
  },
];

export default async function HelpPage() {
  const [zones, settings] = await Promise.all([
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ city: "asc" }, { fee: "asc" }] }),
    prisma.setting.findMany({ where: { key: { in: ["contact.phone", "contact.whatsapp", "contact.email"] } } }),
  ]);
  const cities = [...new Set(zones.map((z) => z.city))];
  const setting = (key: string) => settings.find((s) => s.key === key)?.value ?? "";
  const whatsapp = waLink(setting("contact.whatsapp"), "Bonjour, j'ai une question sur Le Beau Défaut.");

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Aide & livraison" }]} />
      <h1 className="font-display text-[36px] font-bold mb-2">Aide & livraison</h1>
      <p className="text-[var(--color-ink-muted)] mb-8">Les réponses aux questions qu&apos;on nous pose le plus.</p>

      <section className="flex flex-col gap-3 mb-12">
        {FAQ.map((f) => (
          <details key={f.q} className="surface group">
            <summary className="flex items-center justify-between gap-3 p-5 cursor-pointer list-none font-semibold">
              {f.q}
              <Icon name="chevron-down" size={16} className="shrink-0 transition-transform group-open:rotate-180 text-[var(--color-ink-muted)]" />
            </summary>
            <p className="px-5 pb-5 -mt-1 text-[var(--color-ink-soft)] leading-relaxed">{f.a}</p>
          </details>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl font-bold mb-4">Tarifs de livraison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cities.map((c) => (
            <div key={c} className="surface overflow-hidden">
              <h3 className="px-5 py-3 font-display font-bold bg-[var(--color-cream-deep)]/60 border-b border-[var(--color-sand)]">{c}</h3>
              <table className="w-full text-sm">
                <tbody>
                  {zones
                    .filter((z) => z.city === c)
                    .map((z) => (
                      <tr key={z.id} className="border-b border-[var(--color-sand)]/60 last:border-0">
                        <td className="px-5 py-2">{z.name}</td>
                        <td className="px-5 py-2 text-[var(--color-ink-muted)]">
                          {z.etaHours <= 24 ? "24 h" : `${Math.round(z.etaHours / 24)} jours`}
                        </td>
                        <td className="px-5 py-2 text-right font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {money(z.fee)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] mt-3">
          Articles très volumineux (cuisines, grandes tables) : retrait sur place ou livraison sur devis.
        </p>
      </section>

      <section className="surface p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <h2 className="font-display text-xl font-bold">Une autre question ?</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Notre équipe répond du lundi au samedi, de 8 h à 18 h.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-gold">
              <Icon name="message" size={15} /> WhatsApp
            </a>
          )}
          <a href={`tel:${setting("contact.phone").replace(/\s/g, "")}`} className="btn btn-outline">
            <Icon name="phone" size={15} /> Appeler
          </a>
          <a href={`mailto:${setting("contact.email")}`} className="btn btn-outline">
            <Icon name="mail" size={15} /> Écrire
          </a>
          <Link href="/compte/commandes" className="btn btn-primary">
            Suivre une commande
          </Link>
        </div>
      </section>
    </div>
  );
}
