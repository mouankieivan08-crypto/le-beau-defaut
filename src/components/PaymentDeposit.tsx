"use client";

import { useState } from "react";
import { DEPOSIT_NUMBERS, SUPPORT_WHATSAPP } from "@/lib/constants";
import { waLink, money } from "@/lib/format";
import Icon from "./Icon";

/**
 * Le dépôt Mobile Money, expliqué là où l'acheteur en a besoin.
 *
 * Rien n'est automatisé et il ne faut pas faire semblant : l'acheteur dépose sur
 * l'un de nos numéros — qu'il copie d'un geste, sans risque d'erreur de chiffre —
 * puis nous envoie la preuve par WhatsApp. Notre équipe confirme ensuite à la main.
 */
export default function PaymentDeposit({
  reference,
  amount,
  compact = false,
}: {
  /** Référence de commande, reprise dans le message WhatsApp. */
  reference?: string;
  amount?: number;
  compact?: boolean;
}) {
  const [copie, setCopie] = useState<string | null>(null);

  const copier = async (valeur: string) => {
    try {
      await navigator.clipboard.writeText(valeur);
      setCopie(valeur);
      setTimeout(() => setCopie((c) => (c === valeur ? null : c)), 2000);
    } catch {
      // Navigateur sans presse-papiers : le numéro reste lisible et recopiable à la main.
    }
  };

  const message = [
    "Bonjour Le Beau Défaut, je viens de faire un dépôt Mobile Money.",
    reference ? `Commande : ${reference}` : null,
    amount ? `Montant : ${money(amount)}` : null,
    "Voici la capture de mon dépôt :",
  ]
    .filter(Boolean)
    .join("\n");

  const whatsapp = waLink(SUPPORT_WHATSAPP, message);

  return (
    <div className={`rounded-xl border border-[var(--color-gold)]/45 bg-[var(--color-gold-pale)]/35 ${compact ? "p-3.5" : "p-4"}`}>
      <p className="flex items-center gap-2 text-sm font-semibold mb-1">
        <Icon name="wallet" size={15} className="text-[var(--color-gold-dark)]" />
        Payer par dépôt Mobile Money
      </p>
      <p className="text-xs text-[var(--color-ink-muted)] mb-3">
        Déposez le montant sur l&apos;un de ces numéros, puis envoyez-nous la capture par WhatsApp.
        Votre commande est confirmée dès que nous avons vérifié le dépôt.
      </p>

      <ul className="flex flex-col gap-2 mb-3">
        {DEPOSIT_NUMBERS.map((n) => (
          <li
            key={n.raw}
            className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-linen)] border border-[var(--color-sand)] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--color-ink-muted)]">{n.operator}</p>
              <p className="font-mono text-base font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                {n.display}
              </p>
              <p className="text-[11px] text-[var(--color-ink-muted)]">au nom de {n.holder}</p>
            </div>
            <button
              type="button"
              onClick={() => copier(n.raw)}
              className="btn btn-outline btn-sm shrink-0"
              aria-label={`Copier le numéro ${n.display}`}
            >
              <Icon name={copie === n.raw ? "check" : "copy"} size={14} />
              {copie === n.raw ? "Copié" : "Copier"}
            </button>
          </li>
        ))}
      </ul>

      {amount ? (
        <p className="text-sm mb-3">
          Montant à déposer :{" "}
          <strong className="font-display text-base" style={{ fontVariantNumeric: "tabular-nums" }}>
            {money(amount)}
          </strong>
        </p>
      ) : null}

      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-gold w-full">
          <Icon name="phone" size={15} /> J&apos;ai payé — envoyer la preuve
        </a>
      )}

      <p className="text-[11px] text-[var(--color-ink-muted)] mt-2">
        Joignez la capture d&apos;écran du dépôt à votre message : c&apos;est elle qui déclenche la confirmation.
      </p>
    </div>
  );
}
