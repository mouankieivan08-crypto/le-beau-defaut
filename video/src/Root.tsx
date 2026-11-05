import React from "react";
import { Composition } from "remotion";
import { Ad, TOTAL } from "./Ad";

/**
 * Deux formats, une seule source :
 *  · vertical 9:16 — Reels, Stories, TikTok, statut WhatsApp (le format qui convertit sur téléphone)
 *  · carré 1:1     — fil Facebook et Instagram
 */
export const Root: React.FC = () => (
  <>
    <Composition id="LBD-Vertical" component={Ad} durationInFrames={TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="LBD-Carre" component={Ad} durationInFrames={TOTAL} fps={30} width={1080} height={1080} />
  </>
);
