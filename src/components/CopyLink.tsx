"use client";

import { useState } from "react";
import Icon from "./Icon";

/** Bouton « copier » : un geste, un retour visuel, aucune manipulation à la main. */
export default function CopyLink({
  value,
  label = "Copier le lien",
  className = "btn btn-outline btn-sm",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copie, setCopie] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopie(true);
          setTimeout(() => setCopie(false), 2000);
        } catch {
          // Presse-papiers indisponible : la valeur reste sélectionnable à l'écran.
        }
      }}
    >
      <Icon name={copie ? "check" : "copy"} size={14} /> {copie ? "Copié" : label}
    </button>
  );
}
