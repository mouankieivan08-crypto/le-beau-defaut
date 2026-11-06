import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, GOLD_STOPS, SERIF, SWOOSH, arc, letterPaths } from "./brand";
import { EASE_IN_OUT, EASE_OUT, clamp } from "./motion";

/** Fond crème, avec un léger vignettage chaud pour éviter l'aplat numérique. */
export function Backdrop({ tone = "cream" }: { tone?: "cream" | "ink" }) {
  const base = tone === "ink" ? C.ink : C.cream;
  const edge = tone === "ink" ? "rgba(0,0,0,0.55)" : "rgba(107,86,71,0.10)";
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 40%, ${base} 55%, ${edge} 100%), ${base}`,
      }}
    />
  );
}

function GoldDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
        {GOLD_STOPS.map((c, i) => (
          <stop key={c} offset={`${(i / (GOLD_STOPS.length - 1)) * 100}%`} stopColor={c} />
        ))}
      </linearGradient>
    </defs>
  );
}

/**
 * Le logo qui se construit : le cercle se trace, les trois lettres montent l'une
 * après l'autre, puis le coup de pinceau doré traverse le D.
 * `at` = image de départ ; `size` = largeur du monogramme en pixels.
 */
export function AnimatedMark({ at, size, ink = C.brown, arcColor = C.arc }: { at: number; size: number; ink?: string; arcColor?: string }) {
  const frame = useCurrentFrame();
  const f = frame - at;
  const id = `or-${at}`;
  const { paths, right } = letterPaths(32, 72, 60);
  const ring = interpolate(f, [0, 26], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const brush = interpolate(f, [30, 46], [0, 1], { ...clamp, easing: EASE_OUT });
  const arcLen = 2 * Math.PI * 50 * (140 / 360);

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: "visible" }}>
      <GoldDefs id={id} />
      <g fill="none" stroke={arcColor} strokeWidth={1.6} strokeLinecap="round">
        {[arc(60, 60, 50, 200, 340), arc(60, 60, 50, 20, 160)].map((d) => (
          <path key={d} d={d} strokeDasharray={arcLen} strokeDashoffset={arcLen * (1 - ring)} />
        ))}
      </g>
      {paths.map((p, i) => {
        const pi = interpolate(f, [8 + i * 5, 24 + i * 5], [0, 1], { ...clamp, easing: EASE_OUT });
        return (
          <g key={p.key} opacity={pi} transform={`translate(0 ${(1 - pi) * 10})`}>
            <path d={p.d} transform={p.transform} fill={ink} fillRule="evenodd" />
          </g>
        );
      })}
      <clipPath id={`${id}-clip`}>
        <rect x={right - 32 * 0.55} y={40} width={32 * 1.15 * brush + 1} height={30} />
      </clipPath>
      {/* Le masque est posé sur un groupe sans transformation : posé sur le tracé lui-même,
          il serait déplacé et agrandi avec lui, et le pinceau disparaîtrait. */}
      <g clipPath={`url(#${id}-clip)`}>
        <path d={SWOOSH} transform={`translate(${right - 32 * 0.55} 54) scale(${(32 * 1.15) / 100})`} fill={`url(#${id})`} />
      </g>
    </svg>
  );
}

/** Le monogramme fixe, pour les petits emplacements (barre d'application, coin d'écran). */
export function Mark({ size, ink = C.brown, arcColor = C.arc }: { size: number; ink?: string; arcColor?: string }) {
  const id = `or-fixe-${size}`;
  const { paths, right } = letterPaths(32, 72, 60);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <GoldDefs id={id} />
      <g fill="none" stroke={arcColor} strokeWidth={2} strokeLinecap="round">
        <path d={arc(60, 60, 50, 200, 340)} />
        <path d={arc(60, 60, 50, 20, 160)} />
      </g>
      {paths.map((p) => (
        <path key={p.key} d={p.d} transform={p.transform} fill={ink} fillRule="evenodd" />
      ))}
      <path d={SWOOSH} transform={`translate(${right - 32 * 0.55} 54) scale(${(32 * 1.15) / 100})`} fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * La transition signature : un grand coup de pinceau doré balaie l'écran.
 * `at` = image où le balayage couvre tout l'écran (le changement de scène s'y cache).
 */
export function GoldSweep({ at, length = 22 }: { at: number; length?: number }) {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at - length / 2, at + length / 2], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [-170, 170]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <GoldDefs id={`balai-${at}`} />
        <g transform={`translate(${x} 0)`}>
          <path d="M-60,120 C-10,70 40,20 140,-20 L190,-20 C110,30 50,80 -10,130 Z" fill={`url(#balai-${at})`} />
          <path d="M-90,120 C-40,80 0,50 60,20 L70,22 C10,55 -30,90 -70,125 Z" fill={C.goldPale} opacity={0.8} />
        </g>
      </svg>
    </AbsoluteFill>
  );
}

/** Cadre de téléphone : coque noire, encoche, écran crème. */
export function Phone({
  width,
  children,
  style,
}: {
  width: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const height = width * 2.05;
  const r = width * 0.13;
  const bezel = width * 0.035;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: r,
        background: "#1b1714",
        padding: bezel,
        boxShadow: `0 ${width * 0.08}px ${width * 0.2}px rgba(20,17,14,0.35), inset 0 0 0 ${width * 0.006}px #3a322b`,
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: r - bezel,
          overflow: "hidden",
          background: C.cream,
          position: "relative",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            top: width * 0.025,
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.3,
            height: width * 0.075,
            borderRadius: width,
            background: "#1b1714",
            zIndex: 20,
          }}
        />
      </div>
    </div>
  );
}

/** Le doigt qui touche l'écran : un cercle qui s'enfonce puis s'efface. */
export function Tap({ at, x, y, size }: { at: number; x: number; y: number; size: number }) {
  const frame = useCurrentFrame();
  const f = frame - at;
  if (f < -8 || f > 20) return null;
  const show = interpolate(f, [-8, 0, 12, 20], [0, 1, 1, 0], clamp);
  const press = interpolate(f, [-8, 0, 4], [1.25, 0.85, 1], clamp);
  const ring = interpolate(f, [0, 16], [0.6, 1.9], clamp);
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, zIndex: 30 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: size,
          border: `3px solid ${C.gold}`,
          transform: `scale(${ring})`,
          opacity: show * (1 - interpolate(f, [0, 16], [0, 1], clamp)),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: size * 0.18,
          borderRadius: size,
          background: "rgba(20,17,14,0.28)",
          border: "2px solid rgba(255,255,255,0.8)",
          transform: `scale(${press})`,
          opacity: show,
        }}
      />
    </div>
  );
}

/** Texte en petites capitales, la signature typographique du logo. */
export function SmallCaps({ children, size, color = C.brown }: { children: React.ReactNode; size: number; color?: string }) {
  return (
    <span style={{ fontFamily: SERIF, fontVariant: "small-caps", fontWeight: 600, fontSize: size, letterSpacing: "0.04em", color }}>
      {children}
    </span>
  );
}
