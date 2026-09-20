"use client";

import { useState } from "react";
import Icon from "./Icon";

/**
 * Partage d'une annonce : WhatsApp d'abord (usage local), puis Facebook et copie du lien.
 * Sur téléphone, le partage natif du système prend le relais quand il est disponible.
 */
export default function ShareButtons({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const url = () => (typeof window === "undefined" ? "" : window.location.href);

  const nativeShare = async () => {
    const shareData = { title, text, url: url() };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copiez le lien :", url());
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-[var(--color-ink-muted)]">Partager :</span>

      <button
        onClick={async () => {
          if (await nativeShare()) return;
          window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url()}`)}`, "_blank", "noopener");
        }}
        className="btn btn-outline btn-sm"
        aria-label="Partager sur WhatsApp"
      >
        <Icon name="message" size={14} /> WhatsApp
      </button>

      <button
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, "_blank", "noopener")}
        className="btn btn-ghost btn-sm"
        aria-label="Partager sur Facebook"
      >
        Facebook
      </button>

      <button onClick={copy} className="btn btn-ghost btn-sm" aria-label="Copier le lien">
        <Icon name={copied ? "check" : "tag"} size={14} />
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
    </div>
  );
}
