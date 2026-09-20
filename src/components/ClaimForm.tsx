"use client";

import { useState } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import { createClaimAction } from "@/lib/actions/claims";
import { CLAIM_TYPES, CLAIM_WINDOW_DAYS } from "@/lib/constants";
import Icon from "./Icon";
import { Alert } from "./ui";
import PhotoInput from "./PhotoInput";

type Item = { id: string; title: string };

/** Formulaire de réclamation : la garantie « défaut conforme » côté acheteur. */
export default function ClaimForm({ orderId, items }: { orderId: string; items: Item[] }) {
  const [state, onSubmit, pending] = useStickyAction(createClaimAction, undefined);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");

  if (state?.success) {
    return (
      <Alert tone="success" title="Réclamation envoyée">
        {state.success}
      </Alert>
    );
  }

  if (!open) {
    return (
      <div className="surface p-5">
        <h2 className="font-display text-lg font-bold">Un problème avec cette commande ?</h2>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1 mb-4">
          Un défaut qui n&apos;était pas annoncé, un article différent, une pièce manquante : signalez-le dans les{" "}
          {CLAIM_WINDOW_DAYS} jours et nous reprenons l&apos;article.
        </p>
        <button onClick={() => setOpen(true)} className="btn btn-outline !text-[var(--color-danger)] !border-[var(--color-danger)]/40">
          <Icon name="alert" size={15} /> Signaler un problème
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface p-5">
      <input type="hidden" name="orderId" value={orderId} />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-bold">Signaler un problème</h2>
          <p className="text-sm text-[var(--color-ink-muted)]">Notre équipe répond sous 48 h.</p>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm !px-2" aria-label="Fermer">
          <Icon name="close" size={16} />
        </button>
      </div>

      {state?.error && (
        <div className="mb-4">
          <Alert tone="danger">{state.error}</Alert>
        </div>
      )}

      <fieldset className="mb-4">
        <legend className="label">Que s&apos;est-il passé ?</legend>
        <div className="flex flex-col gap-2">
          {CLAIM_TYPES.map((t) => (
            <label
              key={t.key}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                type === t.key ? "border-[var(--color-danger)] bg-[var(--color-grade-c-bg)]/60" : "border-[var(--color-sand)]"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t.key}
                checked={type === t.key}
                onChange={() => setType(t.key)}
                className="mt-0.5 accent-[var(--color-danger)]"
                required
              />
              <span>
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block text-xs text-[var(--color-ink-muted)]">{t.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {items.length > 1 && (
        <div className="mb-4">
          <label className="label" htmlFor="orderItemId">
            Quel article ?
          </label>
          <select id="orderItemId" name="orderItemId" className="field" defaultValue="">
            <option value="">Toute la commande</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>
        </div>
      )}
      {items.length === 1 && <input type="hidden" name="orderItemId" value={items[0].id} />}

      <div className="mb-4">
        <label className="label" htmlFor="claim-description">
          Expliquez en quelques lignes
        </label>
        <textarea
          id="claim-description"
          name="description"
          rows={4}
          className="field"
          placeholder="Ex. Le canapé a une déchirure de 10 cm sur l'assise, elle n'est ni sur les photos ni dans la description."
          required
        />
      </div>

      <div className="mb-4">
        <label className="label" htmlFor="claim-photo">
          Photo du problème (fortement conseillée)
        </label>
        <PhotoInput id="claim-photo" name="photo" type="file" accept="image/*" capture="environment" className="text-sm" />
      </div>

      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer la réclamation"}
      </button>
    </form>
  );
}
