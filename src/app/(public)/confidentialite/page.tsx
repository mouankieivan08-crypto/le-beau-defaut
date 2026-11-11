import type { Metadata } from "next";
import { BRAND, CLAIM_WINDOW_DAYS } from "@/lib/constants";
import { LegalShell, LegalSection } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Confidentialité et cookies",
  description: "Quelles données Le Beau Défaut collecte, pourquoi, combien de temps, et comment les faire effacer.",
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Confidentialité et cookies"
      updated="26 septembre 2026"
      intro="Nous collectons le strict nécessaire pour livrer une commande et trancher un litige. Rien n'est vendu, rien n'est cédé à des tiers pour de la publicité."
    >
      <LegalSection title="Ce que nous collectons, et pourquoi">
        <p>
          <strong>Votre compte</strong> — prénom, nom, e-mail, téléphone, ville et quartier. Sans ces
          informations, impossible de vous livrer ni de vous reconnaître.
        </p>
        <p>
          <strong>Vos commandes</strong> — articles, montants, adresse de livraison, moyen de paiement choisi,
          historique des étapes. Nécessaires à la vente, à la comptabilité et au suivi des réclamations.
        </p>
        <p>
          <strong>Vos messages</strong> — vos échanges avec notre équipe (questions, service client,
          réclamations), conservés pour pouvoir vous répondre et régler un éventuel désaccord.
        </p>
        <p>
          <strong>Vos photos</strong> — celles que vous joignez à une réclamation ou à une preuve de paiement.
        </p>
        <p>
          Nous ne collectons aucune donnée bancaire : le paiement se fait par dépôt Mobile Money sur notre
          numéro, en dehors du site.
        </p>
      </LegalSection>

      <LegalSection title="Les cookies">
        <p>
          Ce site n&apos;utilise <strong>aucun cookie publicitaire</strong>, aucun traceur, aucun outil de mesure
          d&apos;audience tiers. Nous ne vous suivons pas d&apos;un site à l&apos;autre.
        </p>
        <p>
          Un seul cookie est déposé, <span className="font-mono text-[13px]">lbd_session</span> : il vous garde
          connecté pendant 30 jours. Il est strictement nécessaire au fonctionnement du site et ne demande donc pas
          votre consentement. Le supprimer vous déconnecte, rien de plus.
        </p>
        <p>
          Votre navigateur peut aussi mémoriser localement de petits réglages d&apos;affichage. Ils ne quittent
          jamais votre appareil.
        </p>
      </LegalSection>

      <LegalSection title="Qui voit vos données">
        <p>
          <strong>Notre équipe</strong>, pour traiter les commandes, les livraisons et les réclamations.
        </p>
        <p>
          <strong>Le livreur</strong> chargé de votre commande : votre nom, votre adresse et votre numéro, pour
          vous livrer. Personne d&apos;autre.
        </p>
        <p>
          <strong>Nos prestataires techniques</strong> : Vercel (hébergement du site) et Supabase (base de données
          et photos, serveurs en Irlande). Ils n&apos;exploitent pas vos données pour leur compte.
        </p>
        <p>Nous ne vendons ni ne louons aucune donnée personnelle. Jamais.</p>
      </LegalSection>

      <LegalSection title="Combien de temps">
        <p>
          Compte actif : tant que vous l&apos;utilisez. Après trois ans sans connexion, nous le supprimons.
        </p>
        <p>
          Commandes et versements : dix ans, comme l&apos;exigent les obligations comptables.
        </p>
        <p>
          Messages et réclamations : trois ans après la clôture. Le délai de réclamation, lui, est de{" "}
          {CLAIM_WINDOW_DAYS} jours après la livraison.
        </p>
        <p>Traces techniques de connexion (tentatives de mot de passe) : 24 heures.</p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez à tout moment consulter, corriger ou faire effacer vos données, demander une copie de votre
          compte, ou vous opposer à un traitement. Depuis <strong>Profil &amp; adresse</strong> vous modifiez déjà
          vos informations vous-même.
        </p>
        <p>
          Pour le reste, écrivez à <strong>{BRAND.email}</strong> : nous répondons sous 30 jours. L&apos;effacement
          d&apos;un compte n&apos;efface pas les factures des commandes déjà livrées, que la loi nous oblige à
          conserver.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les mots de passe sont stockés chiffrés (bcrypt) : personne, chez nous, ne peut les lire. Les échanges
          avec le site sont chiffrés (HTTPS). Les tentatives de connexion répétées sont bloquées automatiquement.
        </p>
        <p>
          En cas de fuite de données touchant vos informations, nous vous prévenons et nous expliquons ce qui
          s&apos;est passé.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
