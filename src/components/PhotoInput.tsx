"use client";

import { useState } from "react";
import { compressImage } from "@/lib/compress-image";

const mo = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`);

/**
 * Champ « choisir une photo » qui allège les images dès la sélection.
 * S'utilise exactement comme <input type="file"> : le formulaire parent,
 * qu'il soit relié à une action serveur ou non, n'a rien à savoir.
 */
export default function PhotoInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    props.onChange?.(event);
    if (files.length === 0) {
      setNote(null);
      return;
    }

    setBusy(true);
    let before = 0;
    let after = 0;
    const out: File[] = [];
    for (const f of files) {
      before += f.size;
      const c = await compressImage(f);
      after += c.size;
      out.push(c);
    }
    try {
      const dt = new DataTransfer();
      out.forEach((f) => dt.items.add(f));
      input.files = dt.files;
    } catch {
      // Navigateur sans DataTransfer : on garde les fichiers d'origine.
      setBusy(false);
      setNote(null);
      return;
    }
    setBusy(false);
    setNote(after < before * 0.9 ? `Photo allégée : ${mo(before)} → ${mo(after)}` : null);
  }

  return (
    <>
      <input {...props} type="file" onChange={handleChange} />
      {busy && <span className="block text-[11px] text-[var(--color-ink-muted)] mt-1">Préparation de la photo…</span>}
      {note && !busy && <span className="block text-[11px] text-[var(--color-grade-a)] mt-1">{note}</span>}
    </>
  );
}
