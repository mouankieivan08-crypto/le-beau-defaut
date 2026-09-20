/**
 * Monogramme LBD — reconstruction vectorielle du logo fourni.
 *
 * Construction : trois capitales Didone en cascade descendante
 *   L (encre, en haut à gauche) → B (or, au milieu) → D (encre, en bas à droite),
 * chaque lettre détachée de la précédente par un fin liseré couleur fond,
 * et l'étoile à quatre branches en haut à droite.
 */

import { useId } from "react";

type Props = {
  size?: number;
  /** "mark" = monogramme seul · "full" = monogramme + nom · "lockup" = version verticale complète */
  variant?: "mark" | "full" | "lockup";
  /** Couleurs inversées pour fond sombre */
  onDark?: boolean;
  className?: string;
};

export const BRAND_COLORS = {
  ink: "#14110E",
  cream: "#FAF5EC",
  goldStops: ["#8C6A24", "#C9A227", "#F0DCA0", "#C9A227", "#8C6A24"],
};

/** Tracés du monogramme dans un repère 100 × 100 (réutilisés par les fichiers SVG exportés). */
export const MONOGRAM = {
  L: "M4,8 H26 V10.2 H20 V63.8 H37.8 V56 H40 V66 H4 V63.8 H10 V10.2 H4 Z",
  B: "M30,24 H45 V24 H53 C62.5,24 67,30 67,37.6 C67,43.6 63.6,48.2 57.6,50.6 C66,52.4 71,58.4 71,66.8 C71,77.6 64.6,84 54.6,84 H30 V81.8 H36 V26.2 H30 Z M45,26.2 V49.8 H52.4 C57.6,49.8 60.2,45.4 60.2,38 C60.2,30.6 57.6,26.2 52.4,26.2 Z M45,52.2 V81.8 H54.2 C60.4,81.8 63.6,76.4 63.6,67 C63.6,57.6 60.4,52.2 54.2,52.2 Z",
  D: "M51,40 H72 C86,40 94,50.5 94,68 C94,85.5 86,96 72,96 H51 V93.8 H57 V42.2 H51 Z M66.5,42.2 V93.8 H71 C80.5,93.8 85.5,84 85.5,68 C85.5,52 80.5,42.2 71,42.2 Z",
  star: "M88,11 C88.8,21 89.9,23.9 97.5,25.5 C89.9,27.1 88.8,30 88,40 C87.2,30 86.1,27.1 78.5,25.5 C86.1,23.9 87.2,21 88,11 Z",
};

/** Décalages de la cascade : le D descend pour dégager la panse haute du B. */
export const T = { L: "translate(-2 -2)", B: "translate(-6 -3)", D: "translate(7 2)", star: "translate(9 -3)" };

export function Monogram({ size = 44, onDark = false }: { size?: number; onDark?: boolean }) {
  // Identifiant unique par instance : si un logo masqué (display:none) porte le premier
  // dégradé du document, Chrome ne peint plus les autres qui le référencent.
  const id = `lbd-${onDark ? "d" : "l"}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = onDark ? BRAND_COLORS.cream : BRAND_COLORS.ink;
  const knockout = onDark ? BRAND_COLORS.ink : BRAND_COLORS.cream;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Le Beau Défaut"
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="20" y1="18" x2="80" y2="92" gradientUnits="userSpaceOnUse">
          {BRAND_COLORS.goldStops.map((c, i) => (
            <stop key={i} offset={`${(i / (BRAND_COLORS.goldStops.length - 1)) * 100}%`} stopColor={c} />
          ))}
        </linearGradient>
      </defs>

      <path d={MONOGRAM.L} fill={ink} transform={T.L} />
      <path
        d={MONOGRAM.B}
        transform={T.B}
        fill={`url(#${id}-gold)`}
        fillRule="evenodd"
        stroke={knockout}
        strokeWidth={3.2}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
      <path
        d={MONOGRAM.D}
        transform={T.D}
        fill={ink}
        fillRule="evenodd"
        stroke={knockout}
        strokeWidth={3.2}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
      <path d={MONOGRAM.star} fill={`url(#${id}-gold)`} transform={T.star} />
    </svg>
  );
}

export default function Logo({ size = 44, variant = "full", onDark = false, className = "" }: Props) {
  const ink = onDark ? BRAND_COLORS.cream : BRAND_COLORS.ink;

  if (variant === "mark") {
    return (
      <span className={`inline-block ${className}`}>
        <Monogram size={size} onDark={onDark} />
      </span>
    );
  }

  if (variant === "lockup") {
    return (
      <span className={`inline-flex flex-col items-center text-center ${className}`}>
        <Monogram size={size} onDark={onDark} />
        <span
          className="font-display font-medium uppercase mt-3"
          style={{ fontSize: size * 0.24, letterSpacing: "0.08em", color: ink, lineHeight: 1.1 }}
        >
          Le Beau Défaut
        </span>
        <span className="flex items-center gap-2 w-full my-2.5" aria-hidden>
          <span className="rule-gold flex-1" />
          <svg width={size * 0.09} height={size * 0.09} viewBox="0 0 24 24">
            <path d="M12 2c.9 6.4 2.6 8.1 9 9-6.4.9-8.1 2.6-9 9-.9-6.4-2.6-8.1-9-9 6.4-.9 8.1-2.6 9-9Z" fill="#B8913C" />
          </svg>
          <span className="rule-gold flex-1" />
        </span>
        <span className="font-script text-gilded" style={{ fontSize: size * 0.2, lineHeight: 1.2 }}>
          Les petits défauts font
          <br />
          de grandes économies
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Monogram size={size} onDark={onDark} />
      <span
        className="font-display font-semibold uppercase leading-none whitespace-nowrap"
        style={{ fontSize: size * 0.36, letterSpacing: "0.06em", color: ink }}
      >
        Le Beau Défaut
      </span>
    </span>
  );
}
