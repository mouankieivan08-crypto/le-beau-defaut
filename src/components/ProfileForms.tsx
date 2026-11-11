"use client";

import { useState } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import { updateProfileAction, changePasswordAction } from "@/lib/actions/auth";
import { CITIES, QUARTIERS } from "@/lib/constants";
import { Alert } from "./ui";

type Profile = { firstName: string; lastName: string; phone: string | null; city: string | null; quartier: string | null; email: string };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, onSubmit, pending] = useStickyAction(updateProfileAction, undefined);
  const [city, setCity] = useState(profile.city ?? "Brazzaville");

  return (
    <form onSubmit={onSubmit} className="surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-lg font-bold">Informations personnelles</h2>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" defaultValue={profile.firstName} className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" defaultValue={profile.lastName} className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={profile.email} className="field" required />
          <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">C&apos;est l&apos;adresse de connexion.</p>
        </div>
        <div>
          <label className="label" htmlFor="phone">Téléphone</label>
          <input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="city">Ville</label>
          <select id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} className="field">
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="quartier">Quartier</label>
          <select id="quartier" name="quartier" defaultValue={profile.quartier ?? ""} className="field" key={city}>
            <option value="">—</option>
            {(QUARTIERS[city] ?? []).map((q) => (
              <option key={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-sm">
        <label className="label" htmlFor="currentPasswordProfile">Mot de passe actuel (seulement si vous changez l&apos;e-mail)</label>
        <input id="currentPasswordProfile" name="currentPassword" type="password" autoComplete="current-password" className="field" />
      </div>

      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, onSubmit, pending] = useStickyAction(changePasswordAction, undefined);

  return (
    <form onSubmit={onSubmit} className="surface p-6 flex flex-col gap-4">
      <h2 className="font-display text-lg font-bold">Mot de passe</h2>
      {state?.error && <Alert tone="danger">{state.error}</Alert>}
      {state?.success && <Alert tone="success">{state.success}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label" htmlFor="current">Actuel</label>
          <input id="current" name="current" type="password" autoComplete="current-password" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="next">Nouveau</label>
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirmation</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} className="field" required />
        </div>
      </div>
      <div>
        <button className="btn btn-outline" disabled={pending}>
          {pending ? "Modification…" : "Changer le mot de passe"}
        </button>
      </div>
    </form>
  );
}
