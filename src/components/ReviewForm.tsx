"use client";

import { useState } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import { submitReviewAction } from "@/lib/actions/shop";
import Icon from "./Icon";
import { Alert } from "./ui";

type Existing = { rating: number; comment: string | null; defectAsDescribed: boolean } | null;

export default function ReviewForm({ productId, existing }: { productId: string; existing: Existing }) {
  const [state, onSubmit, pending] = useStickyAction(submitReviewAction, undefined);
  const [rating, setRating] = useState(existing?.rating ?? 5);

  return (
    <form onSubmit={onSubmit} className="surface p-5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      <h3 className="font-display text-lg font-bold mb-1">
        {existing ? "Modifier votre avis" : "Vous avez reçu cet article"}
      </h3>
      <p className="text-sm text-[var(--color-ink-muted)] mb-4">
        Dites-nous surtout une chose : le défaut annoncé correspondait-il à la réalité ?
      </p>

      {state?.error && (
        <div className="mb-4">
          <Alert tone="danger">{state.error}</Alert>
        </div>
      )}
      {state?.success && (
        <div className="mb-4">
          <Alert tone="success">{state.success}</Alert>
        </div>
      )}

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="text-[var(--color-gold)] hover:scale-110 transition-transform"
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            <Icon name={n <= rating ? "star-filled" : "star"} size={26} />
          </button>
        ))}
        <span className="text-sm text-[var(--color-ink-muted)] ml-2">{rating}/5</span>
      </div>

      <label className="flex items-center gap-2.5 mb-4 cursor-pointer text-sm">
        <input
          type="checkbox"
          name="defectAsDescribed"
          defaultChecked={existing?.defectAsDescribed ?? true}
          className="accent-[var(--color-gold)] h-4 w-4"
        />
        Le défaut était bien conforme à ce qui était annoncé
      </label>

      <textarea
        name="comment"
        rows={3}
        defaultValue={existing?.comment ?? ""}
        placeholder="Votre commentaire (facultatif) — état à la réception, livraison, contact vendeur…"
        className="field mb-4"
      />

      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Envoi…" : existing ? "Mettre à jour" : "Publier mon avis"}
      </button>
    </form>
  );
}
