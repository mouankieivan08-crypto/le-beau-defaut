"use client";

import { useState } from "react";
import Icon from "./Icon";

export type GalleryImage = { id: string; url: string; alt: string | null; isDefect: boolean };

export default function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (images.length === 0) {
    return (
      <div className="surface aspect-[4/3] grid place-items-center text-[var(--color-ink-muted)]">
        <Icon name="camera" size={38} />
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  const go = (d: number) => setActive((a) => (a + d + images.length) % images.length);

  return (
    <div>
      <div className="surface overflow-hidden relative group">
        <div className="aspect-[4/3] bg-[var(--color-cream-deep)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.alt ?? title}
            className={`h-full w-full object-cover transition-transform duration-300 ${
              zoom ? "scale-[1.7] cursor-zoom-out" : "cursor-zoom-in"
            }`}
            onClick={() => setZoom((z) => !z)}
          />
        </div>

        {current.isDefect && (
          <span className="absolute top-3 left-3 chip bg-[var(--color-ink)] text-[var(--color-cream)]">
            <Icon name="search" size={11} /> Photo du défaut
          </span>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-[var(--color-linen)]/90 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image précédente"
            >
              <Icon name="chevron-left" size={17} />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full bg-[var(--color-linen)]/90 backdrop-blur shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image suivante"
            >
              <Icon name="chevron-right" size={17} />
            </button>
            <span className="absolute bottom-3 right-3 chip bg-[var(--color-ink)]/75 text-[var(--color-cream)]">
              {active + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                setActive(i);
                setZoom(false);
              }}
              className={`relative shrink-0 h-[68px] w-[68px] rounded-lg overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-[var(--color-gold)] shadow-sm"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
              aria-label={`Image ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              {img.isDefect && (
                <span className="absolute inset-x-0 bottom-0 bg-[var(--color-ink)]/80 text-[var(--color-cream)] text-[8px] font-bold text-center py-0.5 uppercase tracking-wide">
                  Défaut
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
