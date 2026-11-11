import Link from "next/link";
import type { Metadata } from "next";
import { BRAND, CLAIM_WINDOW_DAYS, DEFAULT_COMMISSION_PCT, ESCROW_RELEASE_DAYS } from "@/lib/constants";
import { LegalShell, LegalSection } from "@/components/Legal";

export const metadata: Metadata = {
  title: "Conditions d'utilisation et de vente",
  description: "Les règles du jeu sur Le Beau Défaut : le défaut annoncé, le paiement, la livraison, les réclamations.",
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Conditions d'utilisation et de vente"
      updated="26 septembre 2026"
      intro="Le contrat entre vous et Le Beau Défaut, écrit pour être lu : ce que nous promettons, ce que nous attendons, et ce qui se passe quand ça se passe mal."
    >
      <LegalSection title="1. Ce qu'est Le Beau Défaut">
        <p>
          La boutique en ligne de {BRAND.city} qui assume le défaut. Chaque article porte un petit défaut,
          photographié, situé et noté — c&apos;est ce qui justifie son prix.
        </p>
        <p>
          Tous les articles du site appartiennent à Le Beau Défaut : nous en sommes le seul vendeur. Il
          n&apos;y a pas de vendeurs tiers sur la plateforme.
        </p>
      </LegalSection>

      <LegalSection title="2. Votre compte">
        <p>
          Il faut avoir 18 ans, donner des informations exactes et garder son mot de passe pour soi. Un compte
          sert à acheter et à suivre ses commandes.
        </p>
        <p>
          Nous pouvons suspendre un compte qui fournit de fausses informations, abuse des réclamations ou
          manque de respect à notre équipe.
        </p>
      </LegalSection>

      <LegalSection title="3. La règle du défaut">
        <p>
          Chaque article indique son défaut : son type, sa zone, sa gravité, et au moins une photo qui le montre. Le
          grade (A, B ou C) impose une remise minimale, vérifiée automatiquement.
        </p>
        <p>
          Si un défaut n&apos;a pas été signalé, vous pouvez faire une réclamation après la livraison.{" "}
          <Link href="/le-defaut" className="underline underline-offset-2">Voir la grille</Link>.
        </p>
      </LegalSection>

      <LegalSection title="4. Prix et paiement">
        <p>
          Les prix sont en francs CFA (XAF), toutes taxes comprises quand elles s&apos;appliquent. Les frais de
          livraison dépendent du quartier et s&apos;affichent avant la validation.
        </p>
        <p>
          Le paiement n&apos;est pas automatisé : vous déposez le montant sur notre numéro Mobile Money, puis vous
          nous envoyez la preuve par WhatsApp. C&apos;est le seul moyen de paiement accepté : ni espèces à la
          livraison, ni paiement sur place. Aucun prélèvement automatique n&apos;est possible depuis votre compte.
        </p>
        <p>
          Une commande n&apos;est confirmée qu&apos;une fois le paiement vérifié par notre équipe, ou au moment de
          la remise pour les paiements en espèces.
        </p>
      </LegalSection>

      <LegalSection title="5. Paiement et réception">
        <p>
          Votre argent est conservé par Le Beau Défaut jusqu&apos;à la réception du meuble. Vous confirmez la réception
          d&apos;un bouton ; sans réponse de votre part, le versement part automatiquement {ESCROW_RELEASE_DAYS} jours
          après la livraison.
        </p>
        <p>
          Si vous ouvrez une réclamation dans ce délai, l&apos;argent reste bloqué le temps que nous tranchions.
        </p>
      </LegalSection>

      <LegalSection title="6. Livraison et retrait">
        <p>
          Nous livrons dans Brazzaville. Le délai dépend du quartier et est indiqué avant la commande. Le livreur
          appelle avant de passer.
        </p>
        <p>
          Certains articles sont à retirer sur place : l&apos;annonce le précise, et notre équipe convient du lieu
          et de l&apos;heure avec vous.
        </p>
      </LegalSection>

      <LegalSection title="7. Réclamations et remboursements">
        <p>
          Si l&apos;article reçu ne correspond pas à l&apos;annonce — défaut non annoncé, article différent, casse
          au transport, pièce manquante, non-livraison — vous avez <strong>{CLAIM_WINDOW_DAYS} jours</strong> après
          la livraison pour ouvrir une réclamation depuis votre commande, photo à l&apos;appui.
        </p>
        <p>
          Nous tranchons : remboursement total ou partiel, reprise de l&apos;article, geste commercial, ou refus
          motivé. Un défaut annoncé et visible sur les photos ne donne pas droit à remboursement : c&apos;est le
          principe même de la maison.
        </p>
      </LegalSection>

      <LegalSection title="8. Si vous vendez">
        <p>
          Vous décrivez honnêtement le défaut, et vous préparez le meuble dès la commande. Notre commission est de
          {DEFAULT_COMMISSION_PCT} % du prix de vente, prélevée uniquement quand la vente aboutit ; publier ne coûte rien.
        </p>
        <p>
          Les échanges restent sur la plateforme. Une vente conclue en dehors nous prive de notre commission et nous
          empêche de sécuriser la transaction.
        </p>
        <p>
          Sont interdits : les produits volés, les armes, les médicaments, les animaux, et tout ce que la loi
          congolaise interdit de vendre.
        </p>
      </LegalSection>

      <LegalSection title="9. Responsabilité">
        <p>
          Nous répondons de la conformité de ce qui est livré. Nous sécurisons le paiement et arbitrons les litiges
          avec le souci de transparence annoncé dans cette page.
        </p>
        <p>
          Le site peut être momentanément indisponible pour maintenance ; nous faisons au mieux pour que cela reste
          rare et court.
        </p>
      </LegalSection>

      <LegalSection title="10. Modification et droit applicable">
        <p>
          Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de page. Les commandes en cours
          restent régies par la version acceptée au moment de l&apos;achat.
        </p>
        <p>
          Droit applicable : celui de la République du Congo. En cas de désaccord, nous cherchons d&apos;abord une
          solution amiable — écrivez-nous à <strong>{BRAND.email}</strong>.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
