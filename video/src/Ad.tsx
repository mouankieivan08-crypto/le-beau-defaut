import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { GoldSweep } from "./components";
import { GradesScene, HookScene, OriginScene } from "./scenes-a";
import { AppScene, CtaScene, TrustScene } from "./scenes-b";

/**
 * La publicité, scène par scène (30 images par seconde, 30 secondes).
 *
 *   0 –  6,5 s  Accroche : « Ce canapé a un défaut. Le voyez-vous ? » → la loupe → le prix
 *   6,5 – 10 s  D'où vient le stock : des meubles invendables pour un rien
 *  10   – 14,5 s La grille du défaut : photographié, situé, noté
 *  14,5 – 23 s  L'application : choisir, payer par dépôt, être livré
 *  23   – 26 s  La garantie : défaut non annoncé = article repris
 *  26   – 30 s  Signature et appel à l'action
 */
export const TIMELINE = [
  { id: "accroche", from: 0, duration: 195, Scene: HookScene },
  { id: "origine", from: 195, duration: 105, Scene: OriginScene },
  { id: "grille", from: 300, duration: 135, Scene: GradesScene },
  { id: "application", from: 435, duration: 255, Scene: AppScene },
  { id: "garantie", from: 690, duration: 90, Scene: TrustScene },
] as const;

export const TOTAL = 900;

export function Ad() {
  return (
    <AbsoluteFill style={{ background: "#FAF5EC" }}>
      {TIMELINE.map(({ id, from, duration, Scene }) => (
        <Sequence key={id} name={id} from={from} durationInFrames={duration}>
          <Scene duration={duration} />
        </Sequence>
      ))}
      <Sequence name="signature" from={780} durationInFrames={120}>
        <CtaScene />
      </Sequence>

      {/* Le coup de pinceau doré masque les grands changements de scène. */}
      <GoldSweep at={195} />
      <GoldSweep at={435} />
      <GoldSweep at={780} />
    </AbsoluteFill>
  );
}
