import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, SANS, SERIF, arc, money, num } from "./brand";
import { Backdrop } from "./components";
import { CATALOGUE, GRADES, HERO } from "./data";
import { EASE_IN_OUT, EASE_OUT, Eyebrow, GradeBadge, Line, clamp, useExit, useLayout, useProgress, useSpring } from "./motion";

/* ============================================================================
 * Scène 1 — L'accroche (0 → 195)
 * « Ce canapé a un défaut. Le voyez-vous ? » — on cherche, la loupe trouve,
 * puis le prix tombe. Toute la promesse de la marque en six secondes.
 * ========================================================================== */
export function HookScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { u, W, vertical } = useLayout();
  const exit = useExit(duration, 10);

  // Boîte photo : toute la largeur, proportions de la photo (3:2).
  const boxW = W;
  const boxH = W / 1.5;
  const top = vertical ? 700 * u : 300 * u;
  const dx = HERO.defectAt.x * boxW;
  const dy = HERO.defectAt.y * boxH;

  // Zoom vers l'accoudoir, puis retour à la vue d'ensemble pour le prix.
  const zin = interpolate(frame, [46, 76], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const zout = interpolate(frame, [112, 134], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const zoom = zin * (1 - zout);
  const scale = 1 + 2.2 * zoom + interpolate(frame, [0, 46], [0.05, 0], clamp);
  const tx = Math.min(dx * (scale - 1), 270 * u) * zoom;

  // La loupe : le cercle ouvert du logo, tracé autour du défaut.
  const ringP = interpolate(frame, [64, 86], [0, 1], { ...clamp, easing: EASE_IN_OUT }) * (1 - zout);
  const ringR = 150 * u;
  const ringX = dx + tx;
  const ringY = top + dy;
  const arcLen = 2 * Math.PI * ringR * (140 / 360);

  const label = useSpring(84) * (1 - zout);
  const firstLines = interpolate(frame, [100, 110], [1, 0], { ...clamp, easing: EASE_IN_OUT });

  // Le prix
  const card = useSpring(132, 18, 140);
  const strike = interpolate(frame, [142, 156], [0, 1], { ...clamp, easing: EASE_OUT });
  const newPrice = useSpring(150, 14, 160);
  const stamp = useSpring(160, 10, 180);
  const saving = HERO.priceOriginal - HERO.price;
  const pct = Math.round((saving / HERO.priceOriginal) * 100);
  const grade = GRADES.find((g) => g.key === HERO.grade)!;

  const headline = vertical ? 92 * u : 70 * u;

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Backdrop />

      {/* Texte du haut */}
      <div style={{ position: "absolute", top: vertical ? 290 * u : 56 * u, left: 60 * u, right: 60 * u, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 * u }}>
        <div style={{ opacity: firstLines, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 * u }}>
          <Eyebrow text="Brazzaville · Mobilier" at={2} size={24 * u} />
          <Line text="Ce canapé a un défaut." at={6} size={headline} color={C.ink} />
          <Line text="Le voyez-vous ?" at={28} size={headline} color={C.goldDeep} italic weight={600} />
        </div>
        {frame >= 104 && (
          <div style={{ position: "absolute", top: vertical ? 70 * u : 20 * u, left: 0, right: 0 }}>
            <Line text={`${HERO.defect}.`} at={106} size={headline} color={C.ink} />
            <div style={{ height: 10 * u }} />
            <Line text={`${num(saving)} FCFA d'économie.`} at={150} size={headline * 0.62} color={C.goldDeep} weight={600} italic />
          </div>
        )}
      </div>

      {/* La photo et son défaut */}
      <div style={{ position: "absolute", top, left: 0, width: boxW, height: boxH, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${dx}px ${dy}px`,
            transform: `translateX(${tx}px) scale(${scale})`,
          }}
        >
          <Img src={staticFile(HERO.photo)} style={{ width: boxW, height: boxH, objectFit: "cover" }} />
          {/* La rayure, tracée sur l'accoudoir : elle grandit avec le zoom. */}
          <svg width={boxW} height={boxH} style={{ position: "absolute", inset: 0 }}>
            <path
              d={`M${dx - 16 * u},${dy - 18 * u} C${dx - 6 * u},${dy - 6 * u} ${dx + 4 * u},${dy + 6 * u} ${dx + 14 * u},${dy + 20 * u}`}
              stroke="rgba(60,35,20,0.55)"
              strokeWidth={1.4 * u}
              fill="none"
              strokeLinecap="round"
              transform={`translate(${0.7 * u} ${0.7 * u})`}
            />
            <path
              d={`M${dx - 16 * u},${dy - 18 * u} C${dx - 6 * u},${dy - 6 * u} ${dx + 4 * u},${dy + 6 * u} ${dx + 14 * u},${dy + 20 * u}`}
              stroke="rgba(255,236,210,0.92)"
              strokeWidth={1.1 * u}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* La loupe */}
      {ringP > 0 && (
        <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={W} height={vertical ? 1920 * u : 1080 * u}>
          <circle cx={ringX} cy={ringY} r={ringR - 4 * u} fill="none" stroke="rgba(250,245,236,0.35)" strokeWidth={22 * u} opacity={ringP} />
          {[arc(ringX, ringY, ringR, 200, 340), arc(ringX, ringY, ringR, 20, 160)].map((d) => (
            <path key={d} d={d} fill="none" stroke={C.gold} strokeWidth={6 * u} strokeLinecap="round" strokeDasharray={arcLen} strokeDashoffset={arcLen * (1 - ringP)} />
          ))}
        </svg>
      )}

      {/* L'étiquette du défaut */}
      {label > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: ringX - 20 * u,
            top: ringY + ringR + 24 * u,
            transform: `scale(${0.6 + 0.4 * label})`,
            transformOrigin: "left top",
            opacity: label,
            background: C.ink,
            color: C.cream,
            borderRadius: 999,
            padding: `${14 * u}px ${26 * u}px`,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 30 * u,
            display: "flex",
            alignItems: "center",
            gap: 12 * u,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 12 * u, height: 12 * u, borderRadius: 99, background: C.gold }} />
          {HERO.defect} · {HERO.defectZone}
        </div>
      )}

      {/* La carte prix */}
      {frame >= 128 && (
        <div
          style={{
            position: "absolute",
            left: 60 * u,
            right: 60 * u,
            top: vertical ? top + boxH + 50 * u : top + boxH - 250 * u,
            transform: `translateY(${(1 - card) * 160 * u}px)`,
            opacity: card,
            background: C.linen,
            borderRadius: 34 * u,
            padding: `${34 * u}px ${40 * u}px`,
            boxShadow: `0 ${24 * u}px ${60 * u}px rgba(107,86,71,0.22)`,
            display: "flex",
            alignItems: "center",
            gap: 30 * u,
          }}
        >
          <GradeBadge grade={grade.key} size={96 * u} color={grade.color} bg={grade.bg} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 26 * u, color: C.muted, fontWeight: 600, letterSpacing: "0.02em" }}>{HERO.title}</div>
            <div style={{ position: "relative", display: "inline-block", fontFamily: SANS, fontSize: 34 * u, color: C.muted, marginTop: 6 * u }}>
              {num(HERO.priceOriginal)} FCFA
              <span style={{ position: "absolute", left: -4 * u, top: "52%", height: 4 * u, width: `${strike * 104}%`, background: C.gradeC, borderRadius: 4 }} />
            </div>
            <div
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 74 * u,
                color: C.ink,
                lineHeight: 1,
                marginTop: 6 * u,
                transform: `scale(${0.7 + 0.3 * newPrice})`,
                transformOrigin: "left center",
                opacity: newPrice,
              }}
            >
              {money(HERO.price)}
            </div>
          </div>
          <div
            style={{
              width: 150 * u,
              height: 150 * u,
              borderRadius: 999,
              background: `linear-gradient(135deg, #A97F22, #D8B24A 45%, #F2E0A6 70%, #C9A227)`,
              color: C.ink,
              display: "grid",
              placeItems: "center",
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 44 * u,
              transform: `rotate(${(1 - stamp) * -50 - 8}deg) scale(${stamp})`,
              boxShadow: `0 ${10 * u}px ${30 * u}px rgba(140,106,36,0.35)`,
            }}
          >
            −{pct} %
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
}

/* ============================================================================
 * Scène 2 — D'où vient le stock (105 images)
 * ========================================================================== */
export function OriginScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { u, vertical, W } = useLayout();
  const exit = useExit(duration, 10);
  const size = vertical ? 76 * u : 60 * u;

  const reasons = [
    { label: "une rayure", icon: "M4 20 L20 4 M8 20 L20 8" },
    { label: "une fin de série", icon: "M5 5h14v14H5z M5 10h14" },
    { label: "un carton abîmé", icon: "M3 8l9-5 9 5v8l-9 5-9-5z M3 8l9 5 9-5 M12 13v8" },
  ];

  // Bandeau de photos qui défile en continu.
  const strip = [...CATALOGUE, ...CATALOGUE];
  const cardW = (vertical ? 330 : 260) * u;
  const shift = interpolate(frame, [0, duration], [0, -cardW * 3.2]);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Backdrop />
      <div style={{ position: "absolute", top: vertical ? 170 * u : 70 * u, left: 70 * u, right: 70 * u, display: "flex", flexDirection: "column", gap: 20 * u, alignItems: "center", textAlign: "center" }}>
        <Eyebrow text="D'où viennent nos meubles" at={2} size={24 * u} />
        <Line text="Les entreprises de mobilier ont du stock qu'elles ne vendent plus pour un rien :" at={6} size={size} stagger={2} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 * u, justifyContent: "center", marginTop: 16 * u }}>
          {reasons.map((r, i) => {
            const s = useSpring(34 + i * 10, 14, 170);
            return (
              <div
                key={r.label}
                style={{
                  transform: `scale(${s})`,
                  opacity: s,
                  display: "flex",
                  alignItems: "center",
                  gap: 14 * u,
                  background: C.linen,
                  border: `${2 * u}px solid ${C.sand}`,
                  borderRadius: 999,
                  padding: `${16 * u}px ${28 * u}px`,
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: 34 * u,
                  color: C.inkSoft,
                }}
              >
                <svg width={34 * u} height={34 * u} viewBox="0 0 24 24" fill="none" stroke={C.goldDeep} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={r.icon} />
                </svg>
                {r.label}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 26 * u }}>
          <Line text="Nous le rachetons." at={70} size={size * 1.05} color={C.brown} />
          <Line text="Vous le payez moins cher." at={80} size={size * 0.9} color={C.goldDeep} italic weight={600} />
        </div>
      </div>

      {/* Bandeau photo */}
      <div style={{ position: "absolute", bottom: vertical ? 120 * u : 40 * u, left: 0, width: W, height: cardW * 0.78, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 22 * u, transform: `translateX(${shift}px)`, opacity: interpolate(frame, [0, 16], [0, 1], clamp) }}>
          {strip.map((p, i) => (
            <div key={i} style={{ width: cardW, height: cardW * 0.78, borderRadius: 26 * u, overflow: "hidden", flexShrink: 0, position: "relative" }}>
              <Img src={staticFile(p.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", left: 14 * u, bottom: 14 * u, background: "rgba(20,17,14,0.75)", color: C.cream, fontFamily: SANS, fontWeight: 700, fontSize: 24 * u, padding: `${6 * u}px ${14 * u}px`, borderRadius: 999 }}>
                −{Math.round(((p.was - p.price) / p.was) * 100)} %
              </div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

/* ============================================================================
 * Scène 3 — La grille du défaut (135 images)
 * ========================================================================== */
export function GradesScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const exit = useExit(duration, 10);
  const size = vertical ? 74 * u : 56 * u;

  const photo = useSpring(18, 20, 120);
  const ring = interpolate(frame, [30, 50], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const highlight = useProgress(86, 100);
  const photoSize = vertical ? 520 * u : 360 * u;
  const r = photoSize * 0.3;
  const arcLen = 2 * Math.PI * r * (140 / 360);

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Backdrop />
      <div
        style={{
          position: "absolute",
          top: vertical ? 150 * u : 60 * u,
          left: 70 * u,
          right: 70 * u,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18 * u,
          textAlign: "center",
        }}
      >
        <Eyebrow text="La grille du défaut" at={2} size={24 * u} />
        <Line text="Chaque défaut est photographié, situé et noté." at={6} size={size} stagger={2} />
      </div>

      <div
        style={{
          position: "absolute",
          top: vertical ? 560 * u : 270 * u,
          left: 70 * u,
          right: 70 * u,
          display: "flex",
          flexDirection: vertical ? "column" : "row",
          alignItems: "center",
          gap: 40 * u,
        }}
      >
        {/* Gros plan du défaut */}
        <div style={{ position: "relative", width: photoSize, height: photoSize, flexShrink: 0, transform: `scale(${0.85 + 0.15 * photo})`, opacity: photo }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 40 * u, overflow: "hidden", boxShadow: `0 ${20 * u}px ${50 * u}px rgba(107,86,71,0.25)` }}>
            <Img src={staticFile(HERO.defectPhoto)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <svg width={photoSize} height={photoSize} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {[arc(photoSize / 2, photoSize / 2, r, 200, 340), arc(photoSize / 2, photoSize / 2, r, 20, 160)].map((d) => (
              <path key={d} d={d} fill="none" stroke={C.gold} strokeWidth={6 * u} strokeLinecap="round" strokeDasharray={arcLen} strokeDashoffset={arcLen * (1 - ring)} />
            ))}
          </svg>
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: -24 * u,
              transform: `translateX(-50%) scale(${ring})`,
              background: C.ink,
              color: C.cream,
              fontFamily: SANS,
              fontWeight: 600,
              fontSize: 26 * u,
              borderRadius: 999,
              padding: `${10 * u}px ${22 * u}px`,
              whiteSpace: "nowrap",
            }}
          >
            {HERO.defect} · {HERO.defectZone}
          </div>
        </div>

        {/* Les trois grades */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 * u, width: "100%", marginTop: vertical ? 30 * u : 0 }}>
          {GRADES.map((g, i) => {
            const s = useSpring(46 + i * 10, 18, 150);
            const isHero = g.key === HERO.grade;
            return (
              <div
                key={g.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24 * u,
                  background: C.linen,
                  borderRadius: 26 * u,
                  padding: `${20 * u}px ${26 * u}px`,
                  border: `${3 * u}px solid ${isHero ? interpolateColor(highlight, C.sand, C.gold) : C.sand}`,
                  transform: `translateX(${(1 - s) * 120 * u}px) scale(${isHero ? 1 + 0.04 * highlight : 1})`,
                  opacity: s * (isHero ? 1 : 1 - 0.35 * highlight),
                  boxShadow: isHero ? `0 ${16 * u * highlight}px ${40 * u}px rgba(201,162,39,${0.25 * highlight})` : "none",
                }}
              >
                <GradeBadge grade={g.key} size={74 * u} color={g.color} bg={g.bg} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 38 * u, color: C.ink }}>{g.name}</div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28 * u, color: g.color }}>Remise {g.range}</div>
                </div>
                {isHero && highlight > 0 && (
                  <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 22 * u, color: C.goldDeep, letterSpacing: "0.08em", textTransform: "uppercase", opacity: highlight }}>
                    Ce canapé
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", left: 70 * u, right: 70 * u, bottom: vertical ? 150 * u : 46 * u, textAlign: "center" }}>
        <Line text="Le défaut annoncé. Le prix ajusté." at={100} size={size * 0.78} color={C.brown} italic weight={600} />
      </div>
    </AbsoluteFill>
  );
}

/** Mélange linéaire de deux couleurs hexadécimales. */
function interpolateColor(t: number, a: string, b: string) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${mix.join(",")})`;
}
