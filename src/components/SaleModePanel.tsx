import Icon from "./Icon";

/**
 * Rappelle à l'acheteur, sur chaque article, qu'il traite directement avec Le Beau Défaut :
 * c'est le seul vendeur de la plateforme.
 */
export default function SaleModePanel({
  compact = false,
}: {
  saleMode?: string;
  supplierName?: string | null;
  compact?: boolean;
}) {
  const points = [
    { icon: "check-circle" as const, text: "Article inspecté, photographié et stocké par notre équipe." },
    { icon: "message" as const, text: "Une question ? Vous parlez directement à Le Beau Défaut." },
    { icon: "truck" as const, text: "Nous préparons et faisons livrer la commande nous-mêmes." },
  ];

  return (
    <div className={`surface ${compact ? "p-3.5" : "p-4"} border-[var(--color-gold)]/40 bg-[var(--color-gold-pale)]/40`}>
      <p className="flex items-center gap-2 text-sm font-semibold mb-1">
        <Icon name="sparkle" size={15} className="text-[var(--color-gold-dark)]" />
        Vendu par Le Beau Défaut
      </p>
      <p className="text-xs text-[var(--color-ink-muted)] mb-3">Cet article nous appartient : sélectionné et vérifié par nos soins.</p>
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
