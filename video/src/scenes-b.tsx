import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, SANS, SCRIPT, SERIF, arc, money, num } from "./brand";
import { AnimatedMark, Backdrop, Mark, Phone, SmallCaps, Tap } from "./components";
import { CATALOGUE, CITY, DEPOSIT, GRADES, HERO, SITE, WHATSAPP } from "./data";
import { EASE_IN_OUT, EASE_OUT, Eyebrow, GradeBadge, Line, clamp, useExit, useLayout, useProgress, useSpring } from "./motion";

const gradeOf = (k: string) => GRADES.find((g) => g.key === k)!;
const REF = "LBD-2026-000032";

/* ============================================================================
 * Scène 4 — L'application, en trois gestes (255 images)
 * ========================================================================== */
export function AppScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { u, vertical, W, H } = useLayout();
  const exit = useExit(duration, 10);

  const phoneW = vertical ? 620 * u : 400 * u;
  const k = phoneW / 600; // unité d'écran du téléphone
  const enter = useSpring(0, 20, 110);

  const step = frame < 106 ? 0 : frame < 198 ? 1 : 2;
  const steps = [
    { n: "1", title: "Choisissez votre meuble", sub: "Filtrez par grade, prix et quartier." },
    { n: "2", title: "Payez par dépôt Mobile Money", sub: "Copiez notre numéro, envoyez la preuve sur WhatsApp." },
    { n: "3", title: "On livre chez vous", sub: `Partout à ${CITY}.` },
  ];
  const stepStart = [0, 106, 198][step];

  const caption = (
    <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: vertical ? "center" : "flex-start", gap: 12 * u, textAlign: vertical ? "center" : "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 * u, opacity: interpolate(frame, [stepStart, stepStart + 10], [0, 1], clamp) }}>
        <div style={{ width: 58 * u, height: 58 * u, borderRadius: 99, background: C.ink, color: C.cream, display: "grid", placeItems: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 32 * u }}>
          {steps[step].n}
        </div>
        <div style={{ display: "flex", gap: 8 * u }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: (i === step ? 40 : 14) * u, height: 8 * u, borderRadius: 9, background: i <= step ? C.gold : C.sand }} />
          ))}
        </div>
      </div>
      <Line text={steps[step].title} at={stepStart + 2} size={(vertical ? 62 : 54) * u} align={vertical ? "center" : "left"} stagger={2} />
      <Line text={steps[step].sub} at={stepStart + 10} size={(vertical ? 32 : 28) * u} font={SANS} weight={500} color={C.muted} align={vertical ? "center" : "left"} stagger={1} letterSpacing="0" lineHeight={1.3} />
    </div>
  );

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Backdrop />
      {vertical ? (
        <>
          <div style={{ position: "absolute", top: 120 * u, left: 60 * u, right: 60 * u }}>{caption}</div>
          <div style={{ position: "absolute", left: (W - phoneW) / 2, top: 500 * u, transform: `translateY(${(1 - enter) * 300 * u}px)`, opacity: enter }}>
            <Phone width={phoneW}>
              <Screens k={k} />
            </Phone>
          </div>
        </>
      ) : (
        <>
          <div style={{ position: "absolute", left: 70 * u, top: 0, bottom: 0, width: 520 * u, display: "flex", alignItems: "center" }}>{caption}</div>
          <div style={{ position: "absolute", right: 90 * u, top: (H - phoneW * 2.05) / 2, transform: `translateY(${(1 - enter) * 200 * u}px)`, opacity: enter }}>
            <Phone width={phoneW}>
              <Screens k={k} />
            </Phone>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
}

/** Les écrans de l'application, joués l'un après l'autre. `k` = 1 pour un téléphone de 600 px. */
function Screens({ k }: { k: number }) {
  const frame = useCurrentFrame();
  const slide = (start: number) => interpolate(frame, [start, start + 12], [100, 0], { ...clamp, easing: EASE_OUT });

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: SANS }}>
      <CatalogueScreen k={k} />
      {frame >= 70 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide(70)}%)` }}>
          <ProductScreen k={k} />
        </div>
      )}
      {frame >= 106 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide(106)}%)` }}>
          <PaymentScreen k={k} />
        </div>
      )}
      {frame >= 198 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${slide(198)}%)` }}>
          <DoneScreen k={k} />
        </div>
      )}
    </div>
  );
}

function AppBar({ k, title }: { k: number; title?: string }) {
  return (
    <div style={{ height: 120 * k, paddingTop: 50 * k, paddingLeft: 26 * k, paddingRight: 26 * k, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `${1.5 * k}px solid ${C.sand}`, background: C.cream }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 * k }}>
        <Mark size={52 * k} />
        <SmallCaps size={26 * k}>{title ?? "Le Beau Défaut"}</SmallCaps>
      </div>
      <svg width={34 * k} height={34 * k} viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round">
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1.2" />
        <circle cx="18" cy="20" r="1.2" />
      </svg>
    </div>
  );
}

function CatalogueScreen({ k }: { k: number }) {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [22, 54], [0, -70 * k], { ...clamp, easing: EASE_IN_OUT });
  const chips = ["Canapés", "Grade B", "< 1 M FCFA", "Poto-Poto"];
  const cardW = 252 * k;

  return (
    <div style={{ position: "absolute", inset: 0, background: C.cream }}>
      <AppBar k={k} />
      <div style={{ padding: `${18 * k}px ${22 * k}px 0` }}>
        <div style={{ height: 62 * k, borderRadius: 99, background: C.linen, border: `${1.5 * k}px solid ${C.sand}`, display: "flex", alignItems: "center", gap: 12 * k, padding: `0 ${22 * k}px`, color: C.muted, fontSize: 24 * k }}>
          <svg width={24 * k} height={24 * k} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          Canapé, table, étagère…
        </div>
        <div style={{ display: "flex", gap: 10 * k, marginTop: 16 * k, flexWrap: "nowrap", overflow: "hidden" }}>
          {chips.map((c, i) => {
            const on = frame >= 6 + i * 6 && i < 3;
            return (
              <div key={c} style={{ flexShrink: 0, padding: `${10 * k}px ${18 * k}px`, borderRadius: 99, fontSize: 21 * k, fontWeight: 600, background: on ? C.ink : C.linen, color: on ? C.cream : C.inkSoft, border: `${1.5 * k}px solid ${on ? C.ink : C.sand}` }}>
                {c}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "absolute", top: 290 * k, left: 22 * k, right: 22 * k, bottom: 0, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 * k, transform: `translateY(${scroll}px)` }}>
          {CATALOGUE.slice(0, 6).map((p, i) => {
            const g = gradeOf(p.grade);
            const pressed = i === 0 && frame >= 60 && frame < 72;
            return (
              <div key={p.title} style={{ background: C.linen, borderRadius: 20 * k, overflow: "hidden", border: `${1.5 * k}px solid ${i === 0 && frame >= 56 ? C.gold : C.sand}`, transform: `scale(${pressed ? 0.96 : 1})` }}>
                <div style={{ position: "relative", height: cardW * 0.78 }}>
                  <Img src={staticFile(p.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", top: 10 * k, right: 10 * k }}>
                    <GradeBadge grade={p.grade} size={38 * k} color={g.color} bg={g.bg} />
                  </div>
                  <div style={{ position: "absolute", top: 10 * k, left: 10 * k, background: C.ink, color: C.cream, fontSize: 17 * k, fontWeight: 700, padding: `${4 * k}px ${10 * k}px`, borderRadius: 99 }}>
                    −{Math.round(((p.was - p.price) / p.was) * 100)} %
                  </div>
                </div>
                <div style={{ padding: `${12 * k}px ${14 * k}px ${14 * k}px` }}>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 21 * k, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</div>
                  <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 25 * k, color: C.ink, marginTop: 4 * k }}>{num(p.price)} F</div>
                  <div style={{ fontSize: 17 * k, color: C.muted, textDecoration: "line-through" }}>{num(p.was)} F</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Tap at={60} x={148 * k} y={320 * k} size={110 * k} />
    </div>
  );
}

function ProductScreen({ k }: { k: number }) {
  const g = gradeOf(HERO.grade);
  const frame = useCurrentFrame();
  const pressed = frame >= 96 && frame < 104;
  return (
    <div style={{ position: "absolute", inset: 0, background: C.cream }}>
      <div style={{ position: "relative", height: 470 * k }}>
        <Img src={staticFile(HERO.photo)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "20% 50%" }} />
        <div style={{ position: "absolute", top: 70 * k, right: 22 * k }}>
          <GradeBadge grade={g.key} size={64 * k} color={g.color} bg={g.bg} />
        </div>
      </div>
      <div style={{ padding: `${24 * k}px ${26 * k}px` }}>
        <div style={{ fontSize: 18 * k, fontWeight: 700, letterSpacing: "0.12em", color: C.muted, textTransform: "uppercase" }}>Canapés · {HERO.quartier}</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 36 * k, color: C.ink, lineHeight: 1.1, marginTop: 8 * k }}>{HERO.title}</div>

        <div style={{ marginTop: 18 * k, display: "flex", gap: 14 * k, alignItems: "center", background: g.bg, borderRadius: 18 * k, padding: `${14 * k}px ${16 * k}px` }}>
          <svg width={40 * k} height={40 * k} viewBox="0 0 40 40">
            <path d={arc(20, 20, 16, 200, 340)} fill="none" stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
            <path d={arc(20, 20, 16, 20, 160)} fill="none" stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
          </svg>
          <div>
            <div style={{ fontSize: 16 * k, fontWeight: 700, color: g.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>Défaut annoncé</div>
            <div style={{ fontSize: 22 * k, color: C.inkSoft, fontWeight: 600 }}>
              {HERO.defect} · {HERO.defectZone}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 14 * k, marginTop: 22 * k }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 44 * k, color: C.ink }}>{money(HERO.price)}</div>
          <div style={{ fontSize: 22 * k, color: C.muted, textDecoration: "line-through" }}>{num(HERO.priceOriginal)}</div>
        </div>

        <div style={{ marginTop: 24 * k, height: 84 * k, borderRadius: 99, background: C.ink, color: C.cream, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 28 * k, transform: `scale(${pressed ? 0.96 : 1})` }}>
          Commander
        </div>
      </div>
      <Tap at={98} x={279 * k} y={835 * k} size={120 * k} />
    </div>
  );
}

function PaymentScreen({ k }: { k: number }) {
  const frame = useCurrentFrame();
  const copied = frame >= 130;
  const sent = frame >= 160;
  const wa = interpolate(frame, [166, 178], [0, 1], { ...clamp, easing: EASE_OUT });

  return (
    <div style={{ position: "absolute", inset: 0, background: C.cream }}>
      <AppBar k={k} title="Paiement" />
      <div style={{ padding: `${26 * k}px ${24 * k}px` }}>
        <div style={{ background: "rgba(243,230,194,0.55)", border: `${2 * k}px solid rgba(201,162,39,0.5)`, borderRadius: 26 * k, padding: 22 * k }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 * k, fontWeight: 700, fontSize: 25 * k, color: C.ink }}>
            <svg width={28 * k} height={28 * k} viewBox="0 0 24 24" fill="none" stroke={C.goldDeep} strokeWidth={2}>
              <rect x="3" y="6" width="18" height="13" rx="2" />
              <path d="M16 12h2" />
            </svg>
            Payer par dépôt Mobile Money
          </div>
          <div style={{ fontSize: 19 * k, color: C.muted, marginTop: 8 * k, lineHeight: 1.35 }}>Déposez le montant, puis envoyez la capture par WhatsApp.</div>

          {DEPOSIT.map((d, i) => {
            const isCopied = i === 0 && copied;
            return (
              <div key={d.number} style={{ marginTop: 16 * k, background: C.linen, border: `${1.5 * k}px solid ${C.sand}`, borderRadius: 18 * k, padding: `${14 * k}px ${16 * k}px`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15 * k, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted }}>{d.operator}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 30 * k, fontWeight: 700, color: C.ink }}>{d.number}</div>
                </div>
                <div style={{ padding: `${10 * k}px ${16 * k}px`, borderRadius: 99, border: `${1.5 * k}px solid ${isCopied ? C.gradeA : C.ink}`, background: isCopied ? "#E6F2EC" : "transparent", color: isCopied ? C.gradeA : C.ink, fontWeight: 700, fontSize: 19 * k }}>
                  {isCopied ? "Copié ✓" : "Copier"}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 18 * k, fontSize: 22 * k, color: C.inkSoft }}>
            Montant à déposer : <b style={{ fontFamily: SERIF, fontSize: 28 * k, color: C.ink }}>{money(HERO.price)}</b>
          </div>

          <div
            style={{
              marginTop: 18 * k,
              height: 80 * k,
              borderRadius: 99,
              background: "linear-gradient(135deg, #A97F22, #D8B24A 45%, #F2E0A6 70%, #C9A227)",
              color: C.ink,
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: 23 * k,
              transform: `scale(${sent && frame < 166 ? 0.96 : 1})`,
            }}
          >
            J&apos;ai payé — envoyer la preuve
          </div>
        </div>
      </div>
      <Tap at={128} x={450 * k} y={305 * k} size={100 * k} />
      <Tap at={158} x={279 * k} y={565 * k} size={120 * k} />

      {/* WhatsApp : le message préparé, la capture jointe */}
      {wa > 0 && (
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - wa) * 100}%)`, background: "#ECE5DD" }}>
          <div style={{ height: 130 * k, paddingTop: 54 * k, background: "#075E54", display: "flex", alignItems: "center", gap: 14 * k, padding: `${54 * k}px ${22 * k}px 0` }}>
            <div style={{ width: 58 * k, height: 58 * k, borderRadius: 99, background: C.cream, display: "grid", placeItems: "center" }}>
              <Mark size={52 * k} />
            </div>
            <div style={{ color: "white" }}>
              <div style={{ fontWeight: 700, fontSize: 25 * k }}>Le Beau Défaut</div>
              <div style={{ fontSize: 17 * k, opacity: 0.85 }}>{WHATSAPP}</div>
            </div>
          </div>
          <Bubble k={k} at={172}>
            Bonjour Le Beau Défaut, je viens de faire un dépôt Mobile Money.
            <br />
            Commande : {REF}
            <br />
            Montant : {money(HERO.price)}
          </Bubble>
          <Bubble k={k} at={182} image>
            <div style={{ background: "#FFCC00", borderRadius: 12 * k, padding: 16 * k, color: "#1a1a1a" }}>
              <div style={{ fontWeight: 800, fontSize: 18 * k }}>MTN MoMo</div>
              <div style={{ fontSize: 16 * k, marginTop: 4 * k }}>Dépôt réussi vers {DEPOSIT[0].number}</div>
              <div style={{ fontWeight: 800, fontSize: 26 * k, marginTop: 6 * k }}>{money(HERO.price)}</div>
            </div>
            <div style={{ fontSize: 17 * k, marginTop: 8 * k }}>Capture du dépôt</div>
          </Bubble>
        </div>
      )}
    </div>
  );
}

function Bubble({ k, at, children, image = false }: { k: number; at: number; children: React.ReactNode; image?: boolean }) {
  const s = useSpring(at, 16, 170);
  const frame = useCurrentFrame();
  const read = frame >= 192;
  if (frame < at - 1) return null;
  return (
    <div
      style={{
        margin: `${18 * k}px ${22 * k}px 0 auto`,
        maxWidth: image ? 360 * k : 440 * k,
        background: "#DCF8C6",
        borderRadius: 18 * k,
        padding: `${14 * k}px ${16 * k}px ${10 * k}px`,
        fontSize: 21 * k,
        color: "#111",
        lineHeight: 1.35,
        transform: `scale(${s})`,
        transformOrigin: "right bottom",
        boxShadow: "0 1px 1px rgba(0,0,0,0.12)",
      }}
    >
      {children}
      <div style={{ textAlign: "right", fontSize: 15 * k, color: read ? "#34B7F1" : "#888", marginTop: 4 * k, fontWeight: 700 }}>✓✓</div>
    </div>
  );
}

function DoneScreen({ k }: { k: number }) {
  const frame = useCurrentFrame();
  const check = useSpring(206, 12, 160);
  const truck = interpolate(frame, [214, 240], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const delivered = frame >= 240;
  const done = useSpring(240, 12, 180);

  return (
    <div style={{ position: "absolute", inset: 0, background: C.cream, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 170 * k }}>
      <div style={{ width: 170 * k, height: 170 * k, borderRadius: 999, background: "#E6F2EC", border: `${5 * k}px solid ${C.gradeA}`, display: "grid", placeItems: "center", transform: `scale(${check})` }}>
        <svg width={90 * k} height={90 * k} viewBox="0 0 24 24" fill="none" stroke={C.gradeA} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 42 * k, color: C.ink, marginTop: 26 * k }}>Commande confirmée</div>
      <div style={{ fontFamily: "monospace", fontSize: 22 * k, color: C.muted, marginTop: 6 * k }}>{REF}</div>

      <div style={{ marginTop: 50 * k, width: 520 * k, background: C.linen, border: `${1.5 * k}px solid ${C.sand}`, borderRadius: 24 * k, padding: 24 * k }}>
        <div style={{ fontWeight: 700, fontSize: 22 * k, color: C.inkSoft }}>{delivered ? `Livré à ${HERO.quartier} ✓` : `En route vers ${HERO.quartier}`}</div>
        <div style={{ position: "relative", height: 90 * k, marginTop: 16 * k }}>
          <div style={{ position: "absolute", left: 20 * k, right: 20 * k, top: 60 * k, height: 6 * k, borderRadius: 9, background: C.sand }} />
          <div style={{ position: "absolute", left: 20 * k, top: 60 * k, height: 6 * k, borderRadius: 9, width: `calc(${truck * 100}% - ${40 * k * truck}px)`, background: C.gold }} />
          <div style={{ position: "absolute", left: `calc(${20 * k}px + ${truck} * (100% - ${120 * k}px))`, top: 0 }}>
            <svg width={80 * k} height={56 * k} viewBox="0 0 40 28" fill="none" stroke={C.ink} strokeWidth={2} strokeLinejoin="round">
              <path d="M2 4h22v15H2z" fill={C.cream} />
              <path d="M24 9h8l5 6v4H24z" fill={C.goldPale} />
              <circle cx="9" cy="22" r="3.5" fill={C.cream} />
              <circle cx="30" cy="22" r="3.5" fill={C.cream} />
            </svg>
          </div>
          <div style={{ position: "absolute", right: 6 * k, top: 30 * k, transform: `scale(${delivered ? 0.6 + 0.4 * done : 1})` }}>
            <svg width={40 * k} height={40 * k} viewBox="0 0 24 24" fill={delivered ? C.gradeA : C.brown}>
              <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * Scène 5 — La garantie (90 images), sur fond sombre pour réveiller l'œil
 * ========================================================================== */
export function TrustScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const exit = useExit(duration, 8);
  const ring = interpolate(frame, [4, 30], [0, 1], { ...clamp, easing: EASE_IN_OUT });
  const R = (vertical ? 170 : 120) * u;
  const arcLen = 2 * Math.PI * R * (140 / 360);
  const size = (vertical ? 96 : 76) * u;
  const shield = useProgress(16, 30);
  const enter = interpolate(frame, [0, 8], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ opacity: exit * enter }}>
      <Backdrop tone="ink" />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 * u, padding: 70 * u, textAlign: "center" }}>
        <svg width={R * 2 + 20 * u} height={R * 2 + 20 * u} style={{ overflow: "visible" }}>
          {[arc(R + 10 * u, R + 10 * u, R, 200, 340), arc(R + 10 * u, R + 10 * u, R, 20, 160)].map((d) => (
            <path key={d} d={d} fill="none" stroke={C.gold} strokeWidth={5 * u} strokeLinecap="round" strokeDasharray={arcLen} strokeDashoffset={arcLen * (1 - ring)} />
          ))}
          <g transform={`translate(${R + 10 * u - 46 * u} ${R + 10 * u - 52 * u}) scale(${(92 * u) / 24})`} opacity={shield}>
            <path d="M12 2.5l7.5 3v6c0 4.6-3.2 8.6-7.5 10-4.3-1.4-7.5-5.4-7.5-10v-6z" fill="none" stroke={C.cream} strokeWidth={1.6} strokeLinejoin="round" />
            <path d="M8.5 12.2l2.4 2.4 4.6-4.8" fill="none" stroke={C.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
        <Line text="Défaut non annoncé ?" at={10} size={size * 0.8} color={C.brownLight} />
        <Line text="Article repris." at={30} size={size * 1.2} color={C.gold} italic />
        <div style={{ marginTop: 10 * u }}>
          <Line text="Ce que vous voyez est ce que vous recevez." at={50} size={size * 0.42} font={SANS} weight={500} color="rgba(239,229,216,0.75)" letterSpacing="0" stagger={1} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/* ============================================================================
 * Scène 6 — La signature et l'appel à l'action (120 images)
 * ========================================================================== */
export function CtaScene() {
  const frame = useCurrentFrame();
  const { u, vertical } = useLayout();
  const markSize = (vertical ? 580 : 300) * u;
  const rule = useProgress(42, 62);
  const word = useProgress(48, 64);
  const tagline = useProgress(58, 76);
  const button = useSpring(74, 14, 150);
  const pulse = 1 + 0.035 * Math.max(0, Math.sin(((frame - 92) / 30) * Math.PI * 2)) * (frame > 92 ? 1 : 0);
  const info = useProgress(86, 100);

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, padding: 60 * u, textAlign: "center" }}>
        <AnimatedMark at={4} size={markSize} />
        <div style={{ width: (vertical ? 820 : 560) * u * rule, height: 2 * u, background: C.arc, marginTop: 6 * u }} />
        <div style={{ opacity: word, transform: `translateY(${(1 - word) * 16}px)`, marginTop: 22 * u }}>
          <SmallCaps size={(vertical ? 86 : 54) * u}>Le Beau Défaut</SmallCaps>
        </div>
        <div style={{ fontFamily: SCRIPT, fontSize: (vertical ? 70 : 44) * u, color: C.goldDeep, marginTop: 18 * u, opacity: tagline, transform: `translateY(${(1 - tagline) * 14}px)`, lineHeight: 1.2 }}>
          Les petits défauts font
          <br />
          de grandes économies
        </div>

        <div
          style={{
            marginTop: (vertical ? 64 : 34) * u,
            transform: `scale(${button * pulse})`,
            opacity: button,
            background: C.ink,
            color: C.cream,
            borderRadius: 999,
            padding: `${(vertical ? 32 : 24) * u}px ${(vertical ? 60 : 46) * u}px`,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: (vertical ? 52 : 34) * u,
            display: "flex",
            alignItems: "center",
            gap: 18 * u,
            boxShadow: `0 ${20 * u}px ${50 * u}px rgba(20,17,14,0.25)`,
          }}
        >
          Voir les articles
          <svg width={40 * u} height={40 * u} viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>

        <div style={{ opacity: info, marginTop: 30 * u, display: "flex", flexDirection: "column", gap: 10 * u, alignItems: "center" }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: (vertical ? 38 : 30) * u, color: C.ink }}>{SITE}</div>
          <div style={{ fontFamily: SANS, fontWeight: 500, fontSize: (vertical ? 30 : 24) * u, color: C.muted, display: "flex", alignItems: "center", gap: 10 * u }}>
            <span style={{ width: 14 * u, height: 14 * u, borderRadius: 99, background: C.whatsapp }} />
            WhatsApp {WHATSAPP} · {CITY}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
