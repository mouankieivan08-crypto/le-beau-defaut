import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, SERIF, SANS } from "./brand";

/** Courbes maison : une entrée nette, une sortie qui s'efface sans traîner. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0 → 1 entre deux images, avec la courbe d'entrée. */
export function useProgress(from: number, to: number, easing = EASE_OUT) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], { ...clamp, easing });
}

/** Ressort amorti, déclenché à une image donnée. */
export function useSpring(at: number, damping = 200, stiffness = 120) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness, mass: 0.9 } });
}

/** Mise à l'échelle commune : tout est dessiné pour 1080 px de large. */
export function useLayout() {
  const { width, height } = useVideoConfig();
  const u = width / 1080;
  return { u, W: width, H: height, vertical: height > width * 1.2 };
}

/** Fondu de sortie sur les dernières images d'une scène. */
export function useExit(duration: number, length = 10) {
  const frame = useCurrentFrame();
  return interpolate(frame, [duration - length, duration], [1, 0], { ...clamp, easing: EASE_IN_OUT });
}

/**
 * Ligne de texte qui monte depuis un masque — le geste de base de toute la vidéo.
 * Chaque mot arrive avec un léger décalage, comme une phrase qu'on dit.
 */
export function Line({
  text,
  at,
  size,
  color = C.ink,
  font = SERIF,
  weight = 700,
  italic = false,
  stagger = 3,
  align = "center",
  lineHeight = 1.08,
  letterSpacing = "-0.01em",
}: {
  text: string;
  at: number;
  size: number;
  color?: string;
  font?: string;
  weight?: number;
  italic?: boolean;
  stagger?: number;
  align?: "center" | "left";
  lineHeight?: number;
  letterSpacing?: string;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: size * 0.26,
        fontFamily: font,
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        fontSize: size,
        lineHeight,
        letterSpacing,
        color,
      }}
    >
      {words.map((w, i) => {
        const p = interpolate(frame, [at + i * stagger, at + i * stagger + 16], [0, 1], { ...clamp, easing: EASE_OUT });
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 105}%)`, opacity: p }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
}

/** Petite étiquette en capitales espacées, pour situer une scène. */
export function Eyebrow({ text, at, size, color = C.goldDeep }: { text: string; at: number; size: number; color?: string }) {
  const p = useProgress(at, at + 14);
  return (
    <div
      style={{
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px)`,
      }}
    >
      {text}
    </div>
  );
}

/** Pastille de grade A / B / C, comme sur le site. */
export function GradeBadge({ grade, size, color, bg }: { grade: string; size: number; color: string; bg: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        border: `${Math.max(2, size * 0.06)}px solid ${color}`,
        background: bg,
        color,
        display: "grid",
        placeItems: "center",
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: size * 0.52,
        flexShrink: 0,
      }}
    >
      {grade}
    </div>
  );
}
