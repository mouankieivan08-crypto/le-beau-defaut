import type { Metadata } from "next";
import { BRAND, DEPOSIT_NUMBERS } from "@/lib/constants";
import { phoneFR } from "@/lib/format";
import { LegalShell, LegalSection, ToComplete } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergeur et responsabilités du site Le Beau Défaut.",
};

export default function LegalNoticePage() {
  return (
    <LegalShell
      title="Mentions légales"
      updated="26 septembre 2026"
      intro="Qui édite ce site, qui l'héberge, et à qui s'adresser."
    >
      <LegalSection title="Éditeur du site">
        <p>
          <strong>{BRAND.name}</strong> — place de marché du mobilier à petit défaut, des sacs de luxe et du
          fourre-tout, à {BRAND.city} (République du Congo).
        </p>
        <p>
          Contact : <strong>{BRAND.email}</strong> · WhatsApp {phoneFR(DEPOSIT_NUMBERS[0].raw)}
        </p>
        <p>
          Forme juridique, numéro RCCM, NIU et siège social : <ToComplete>à compléter dès l&apos;immatriculation</ToComplete>.
          Tant que ces informations ne sont pas publiées, Le Beau Défaut fonctionne comme une activité en cours de
          formalisation et le précise honnêtement à ses clients.
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>
          Le représentant de {BRAND.name}, joignable à l&apos;adresse <strong>{BRAND.email}</strong>.
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong> (340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis)
          et les données sont stockées par <strong>Supabase</strong> sur des serveurs situés en Irlande (Union
          européenne).
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Le nom Le Beau Défaut, son monogramme, sa charte graphique et les textes du site appartiennent à
          l&apos;éditeur. Les photographies d&apos;articles appartiennent à leurs vendeurs, qui autorisent leur
          publication sur le site en les déposant.
        </p>
        <p>
          Toute reprise du logo ou des contenus sans accord écrit est interdite. Un vendeur peut demander le
          retrait de ses photographies à tout moment en nous écrivant.
        </p>
      </LegalSection>

      <LegalSection title="Rôle de Le Beau Défaut dans les ventes">
        <p>
          Deux situations, indiquées sur chaque annonce :
        </p>
        <p>
          <strong>Mobilier et sacs de luxe</strong> — les articles nous appartiennent. Nous sommes le vendeur et
          nous répondons de la conformité de ce qui est livré.
        </p>
        <p>
          <strong>Fourre-tout</strong> — l&apos;article appartient à un vendeur inscrit. Nous sommes intermédiaire :
          nous hébergeons l&apos;annonce, nous conservons le paiement jusqu&apos;à la réception et nous tranchons les
          réclamations. La conformité de l&apos;article reste de la responsabilité du vendeur.
        </p>
      </LegalSection>

      <LegalSection title="Signaler un contenu">
        <p>
          Une annonce trompeuse, une contrefaçon, un contenu illicite ? Écrivez-nous à <strong>{BRAND.email}</strong> en
          indiquant la référence de l&apos;article. Nous retirons ou suspendons l&apos;annonce le temps de vérifier.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
