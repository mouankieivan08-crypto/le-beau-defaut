"use client";

import { useMemo, useState } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import { checkoutAction } from "@/lib/actions/shop";
import { PAYMENT_METHODS, QUARTIERS, CITIES } from "@/lib/constants";
import PaymentDeposit from "./PaymentDeposit";
import { money } from "@/lib/format";
import Icon from "./Icon";
import { Alert, GradeBadge } from "./ui";

type Zone = { city: string; name: string; fee: number; etaHours: number };
type Line = { id: string; title: string; image: string | null; qty: number; price: number; grade: string; pickupOnly: boolean };
type Address = { fullName: string; phone: string; city: string; quartier: string; landmark: string | null } | null;

export default function CheckoutForm({
  zones,
  lines,
  address,
  defaultFee,
}: {
  zones: Zone[];
  lines: Line[];
  address: Address;
  defaultFee: number;
}) {
  const [state, onSubmit, pending] = useStickyAction(checkoutAction, undefined);
  const [city, setCity] = useState(address?.city ?? "Brazzaville");
  const [quartier, setQuartier] = useState(address?.quartier ?? "");
  const [method, setMethod] = useState<string>("ESPECES_LIVRAISON");

  const quartiers = useMemo(() => {
    const fromZones = zones.filter((z) => z.city === city).map((z) => z.name);
    return Array.from(new Set([...fromZones, ...(QUARTIERS[city] ?? [])]));
  }, [city, zones]);

  const zone = zones.find((z) => z.city === city && z.name === quartier);
  const allPickup = lines.every((l) => l.pickupOnly);
  const fee = allPickup ? 0 : zone?.fee ?? defaultFee;
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const total = subtotal + fee;

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
      <div className="flex flex-col gap-5">
        {state?.error && <Alert tone="danger">{state.error}</Alert>}

        {/* Livraison */}
        <section className="surface p-6">
          <h2 className="font-display text-lg font-bold mb-1 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] text-xs grid place-items-center font-sans">
              1
            </span>
            Où livrer ?
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-5">
            Le livreur vous appelle avant de passer. Un repère précis lui fait gagner beaucoup de temps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="recipientName">
                Nom du destinataire
              </label>
              <input
                id="recipientName"
                name="recipientName"
                defaultValue={address?.fullName ?? ""}
                className="field"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="recipientPhone">
                Téléphone
              </label>
              <input
                id="recipientPhone"
                name="recipientPhone"
                type="tel"
                defaultValue={address?.phone ?? ""}
                className="field"
                placeholder="06 612 34 56"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="city">
                Ville
              </label>
              <select
                id="city"
                name="city"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setQuartier("");
                }}
                className="field"
              >
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="quartier">
                Quartier
              </label>
              <select
                id="quartier"
                name="quartier"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                className="field"
                required
              >
                <option value="">Choisir…</option>
                {quartiers.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="landmark">
                Repère
              </label>
              <input
                id="landmark"
                name="landmark"
                defaultValue={address?.landmark ?? ""}
                className="field"
                placeholder="Ex. en face de la pharmacie, portail vert"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="notes">
                Instructions (facultatif)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="field"
                placeholder="Étage, disponibilités, montage souhaité…"
              />
            </div>
          </div>

          {zone && !allPickup && (
            <p className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)] mt-4">
              <Icon name="truck" size={14} className="text-[var(--color-gold)]" />
              {quartier} : livraison sous {zone.etaHours <= 24 ? "24 h" : `${Math.round(zone.etaHours / 24)} jours`} —{" "}
              {money(zone.fee)}
            </p>
          )}
          {allPickup && (
            <div className="mt-4">
              <Alert tone="info">
                Ces articles sont volumineux : retrait sur place. Le vendeur vous contacte pour fixer un
                rendez-vous.
              </Alert>
            </div>
          )}
        </section>

        {/* Paiement */}
        <section className="surface p-6">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] text-xs grid place-items-center font-sans">
              2
            </span>
            Paiement
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.key}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  method === m.key
                    ? "border-[var(--color-gold)] bg-[var(--color-gold-pale)]/35"
                    : "border-[var(--color-sand)] hover:border-[var(--color-gold-light)]"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.key}
                  checked={method === m.key}
                  onChange={() => setMethod(m.key)}
                  className="mt-1 accent-[var(--color-gold)]"
                />
                <span>
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block text-xs text-[var(--color-ink-muted)] mt-0.5">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>

          {method === "DEPOT_MOBILE_MONEY" && (
            <div className="mt-4">
              <PaymentDeposit amount={total} compact />
            </div>
          )}

          {method === "ESPECES_SUR_PLACE" && (
            <div className="mt-4">
              <Alert tone="info" title="Paiement sur place">
                Notre équipe vous appelle pour convenir du lieu et de l&apos;heure du retrait. Vous réglez en
                espèces en récupérant l&apos;article — rien n&apos;est prélevé avant.
              </Alert>
            </div>
          )}

          {method === "ESPECES_LIVRAISON" && (
            <div className="mt-4">
              <Alert tone="info" title="Espèces à la livraison">
                Vous payez le livreur au moment de la remise, après avoir vu l&apos;article et son défaut.
                Prévoyez l&apos;appoint si possible.
              </Alert>
            </div>
          )}
        </section>
      </div>

      {/* Récapitulatif */}
      <aside className="surface p-5 lg:sticky lg:top-[136px]">
        <h2 className="font-display text-lg font-bold mb-4">Votre commande</h2>
        <ul className="flex flex-col gap-3 mb-4">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3">
              {l.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.image} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug line-clamp-2">{l.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <GradeBadge grade={l.grade} size="sm" />
                  <span className="text-xs text-[var(--color-ink-muted)]">× {l.qty}</span>
                </div>
              </div>
              <p className="text-sm font-semibold whitespace-nowrap">{money(l.price * l.qty)}</p>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-2 text-sm pt-4 border-t border-[var(--color-sand)]">
          <div className="flex justify-between">
            <dt className="text-[var(--color-ink-muted)]">Sous-total</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-ink-muted)]">Livraison</dt>
            <dd>{allPickup ? "Retrait" : quartier ? money(fee) : "—"}</dd>
          </div>
        </dl>
        <div className="rule-gold my-4" />
        <div className="flex justify-between items-baseline mb-5">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl font-bold">{money(total)}</span>
        </div>

        <button className="btn btn-gold btn-lg w-full" disabled={pending || (!quartier && !allPickup)}>
          {pending ? "Validation…" : `Confirmer — ${money(total)}`}
        </button>
        <p className="text-[11px] text-center text-[var(--color-ink-muted)] mt-3 leading-relaxed">
          En confirmant, vous reconnaissez avoir pris connaissance des défauts décrits pour chaque article.
        </p>
      </aside>
    </form>
  );
}
