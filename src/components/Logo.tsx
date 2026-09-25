/**
 * Logo Le Beau Défaut.
 *
 * Trois formes, une seule géométrie (voir src/lib/logo-geometry.ts) :
 *  · "mark"    — le monogramme seul, dans son cercle : icône, avatar, favicon ;
 *  · "full"    — monogramme + nom sur une ligne : en-têtes du site ;
 *  · "lockup"  — la composition complète, filet et signature : pages de marque.
 */

import { useId } from "react";
import {
  BRAND_COLORS,
  LOCKUP,
  LOCKUP_BOX,
  MARK,
  MARK_BOX,
  letterPaths,
  ringArcs,
  swooshPath,
} from "@/lib/logo-geometry";

export { BRAND_COLORS };

type Props = {
  size?: number;
  variant?: "mark" | "full" | "lockup";
  /** Couleurs éclaircies pour un fond sombre. */
  onDark?: boolean;
  className?: string;
};

function GoldGradient({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
      {BRAND_COLORS.goldStops.map((c, i) => (
        <stop key={c} offset={`${(i / (BRAND_COLORS.goldStops.length - 1)) * 100}%`} stopColor={c} />
      ))}
    </linearGradient>
  );
}

export function Monogram({ size = 44, onDark = false }: { size?: number; onDark?: boolean }) {
  // Un identifiant par instance : deux dégradés de même nom dans une page et
  // le navigateur n'en peint plus qu'un seul.
  const gold = `lbd-or-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = onDark ? BRAND_COLORS.brownLight : BRAND_COLORS.brown;
  const arc = onDark ? BRAND_COLORS.arcOnDark : BRAND_COLORS.arc;

  const { paths, right } = letterPaths(MARK.letters);
  const brush = swooshPath({ x: right - MARK.letters.cap * MARK.swoosh.back, y: MARK.swoosh.y, w: MARK.letters.cap * MARK.swoosh.width });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK_BOX} ${MARK_BOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Le Beau Défaut"
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <GoldGradient id={gold} />
      </defs>
      <g fill="none" stroke={arc} strokeWidth={1.8} strokeLinecap="round">
        {ringArcs(MARK.ring).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {paths.map((p) => (
        <path key={p.transform} d={p.d} transform={p.transform} fill={ink} fillRule="evenodd" />
      ))}
      <path d={brush.d} transform={brush.transform} fill={`url(#${gold})`} />
    </svg>
  );
}

/** La composition complète : monogramme, filet, et le nom en petites capitales. */
export function Lockup({ width = 280, onDark = false }: { width?: number; onDark?: boolean }) {
  const gold = `lbd-or-l-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = onDark ? BRAND_COLORS.brownLight : BRAND_COLORS.brown;
  const arc = onDark ? BRAND_COLORS.arcOnDark : BRAND_COLORS.arc;
  const rule = onDark ? BRAND_COLORS.ruleOnDark : BRAND_COLORS.rule;

  const { paths, right } = letterPaths(LOCKUP.letters);
  const brush = swooshPath({ x: right - LOCKUP.letters.cap * LOCKUP.swoosh.back, y: LOCKUP.swoosh.y, w: LOCKUP.letters.cap * LOCKUP.swoosh.width });

  return (
    <svg
      width={width}
      height={(width * LOCKUP_BOX.h) / LOCKUP_BOX.w}
      viewBox={`0 0 ${LOCKUP_BOX.w} ${LOCKUP_BOX.h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Le Beau Défaut"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <defs>
        <GoldGradient id={gold} />
      </defs>
      <g fill="none" stroke={arc} strokeWidth={1.8} strokeLinecap="round">
        {ringArcs(LOCKUP.ring).map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {paths.map((p) => (
        <path key={p.transform} d={p.d} transform={p.transform} fill={ink} fillRule="evenodd" />
      ))}
      <path d={brush.d} transform={brush.transform} fill={`url(#${gold})`} />
      <rect x={LOCKUP.rule.x} y={LOCKUP.rule.y} width={LOCKUP.rule.w} height={1} fill={rule} />
      <text
        x={LOCKUP.word.x}
        y={LOCKUP.word.y}
        textAnchor="middle"
        fontSize={LOCKUP.word.size}
        fill={ink}
        style={{
          fontFamily: "var(--font-display, 'Playfair Display'), Didot, 'Times New Roman', serif",
          fontVariant: "small-caps",
          letterSpacing: "1.2px",
          fontWeight: 500,
        }}
      >
        Le Beau Défaut
      </text>
    </svg>
  );
}

export default function Logo({ size = 44, variant = "full", onDark = false, className = "" }: Props) {
  const ink = onDark ? BRAND_COLORS.brownLight : BRAND_COLORS.brown;

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
        <Lockup width={size * 5.2} onDark={onDark} />
        <span className="font-script text-gilded mt-1" style={{ fontSize: size * 0.42, lineHeight: 1.25 }}>
          Les petits défauts font
          <br />
          de grandes économies
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Monogram size={size} onDark={onDark} />
      <span
        className="font-display leading-none whitespace-nowrap"
        style={{
          fontSize: size * 0.42,
          letterSpacing: "0.04em",
          color: ink,
          fontVariant: "small-caps",
          fontWeight: 500,
        }}
      >
        Le Beau Défaut
      </span>
    </span>
  );
}
