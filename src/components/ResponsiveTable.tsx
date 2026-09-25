"use client";

import { useEffect, useRef } from "react";

/**
 * Un tableau qui devient une liste de fiches sur téléphone.
 *
 * Sur un écran de 375 px, un tableau de sept colonnes oblige à faire glisser
 * horizontalement pour lire une seule ligne. Ici, chaque ligne devient une fiche
 * où l'intitulé de la colonne est repris devant la valeur — et sur ordinateur,
 * le tableau reste un tableau.
 */
export default function ResponsiveTable({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const table = ref.current?.querySelector("table");
    if (!table) return;

    const titles = [...table.querySelectorAll("thead th")].map((th) => (th.textContent ?? "").trim());
    for (const row of table.querySelectorAll("tbody tr")) {
      [...row.children].forEach((cell, i) => {
        const titre = titles[i];
        if (titre && !cell.getAttribute("data-label")) cell.setAttribute("data-label", titre);
      });
    }
  });

  return (
    <div ref={ref} className={`surface overflow-x-auto table-card ${className}`}>
      {children}
    </div>
  );
}
