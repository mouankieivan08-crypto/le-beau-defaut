import { ESCROW_RELEASE_DAYS } from "@/lib/constants";
import Icon from "./Icon";

/**
 * Dit à l'acheteur, sur chaque annonce, à qui il a affaire.
 *
 * Deux situations, deux promesses différentes :
 * l'article est à nous et nous répondons de tout — ou nous mettons en relation,
 * et c'est le séquestre qui protège l'acheteur.
 */
export default function SaleModePanel({
  saleMode,
  supplierName,
  compact = false,
}: {
  saleMode: string;
  supplierName?: string | null;
  compact?: boolean;
}) {
  const house = saleMode === "MAISON";

  const points = house
    ? [
        { icon: "check-circle" as const, text: "Article inspecté, photographié et stocké par notre équipe." },
        { icon: "message" as const, text: "Une question ? Vous parlez directement à Le Beau Défaut." },
        { icon: "truck" as const, text: "Nous préparons et faisons livrer la commande nous-mêmes." },
      ]
    : [
        { icon: "shield" as const, text: "Votre paiement est conservé par Le Beau Défaut, pas envoyé au vendeur." },
        { icon: "message" as const, text: "Vous échangez dans la messagerie du site : aucun numéro ne circule." },
        {
          icon: "wallet" as const,
          text: `Le vendeur est payé ${ESCROW_RELEASE_DAYS} jours après la livraison, si vous n'avez rien signalé.`,
        },
      ];

  return (
    <div
      className={`surface ${compact ? "p-3.5" : "p-4"} ${
        house ? "border-[var(--color-gold)]/40 bg-[var(--color-gold-pale)]/40" : ""
      }`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold mb-1">
        <Icon name={house ? "sparkle" : "shield"} size={15} className="text-[var(--color-gold-dark)]" />
        {house ? "Vendu par Le Beau Défaut" : "Mise en relation sécurisée"}
      </p>
      <p className="text-xs text-[var(--color-ink-muted)] mb-3">
        {house
          ? supplierName
            ? `Racheté à ${supplierName}, remis en lumière par nos soins.`
            : "Cet article nous appartient : nous l'avons racheté pour le revendre à son juste prix."
          : "Le Beau Défaut ne possède pas cet article : il appartient à un vendeur du fourre-tout. Nous sécurisons la transaction."}
      </p>
      <ul className="flex flex-col gap-2">
        {points.map((p) => (
          <li key={p.text} className="flex items-start gap-2 text-xs text-[var(--color-ink-soft)]">
            <Icon name={p.icon} size={13} className="mt-0.5 shrink-0 text-[var(--color-gold-dark)]" />
            <span>{p.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
