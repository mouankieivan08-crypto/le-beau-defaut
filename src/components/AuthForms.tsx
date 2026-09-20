"use client";

import { useState } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import Link from "next/link";
import { loginAction, registerAction } from "@/lib/actions/auth";
import { CITIES } from "@/lib/constants";
import Icon from "./Icon";
import { Alert } from "./ui";

// Comptes de démonstration montrés au public : uniquement les deux profils du site.
const DEMO_ACCOUNTS = [
  { label: "Acheteur", email: "client@lebeaudefaut.cg" },
  { label: "Vendeur fourre-tout", email: "vendeur@lebeaudefaut.cg" },
];

// Réservés à la page d'accès de l'équipe, qui n'est liée nulle part sur le site.
const TEAM_ACCOUNTS = [
  { label: "Administration", email: "admin@lebeaudefaut.cg" },
  { label: "Boutique maison", email: "maison@lebeaudefaut.cg" },
  { label: "Livreur", email: "livreur@lebeaudefaut.cg" },
];

export function LoginForm({ next, team = false }: { next?: string; team?: boolean }) {
  const accounts = team ? TEAM_ACCOUNTS : DEMO_ACCOUNTS;
  const [state, onSubmit, pending] = useStickyAction(loginAction, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? ""} />
        {state?.error && <Alert tone="danger">{state.error}</Alert>}

        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="vous@exemple.cg"
          />
        </div>

        <div>
          <label className="label" htmlFor="password">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              <Icon name="eye" size={17} />
            </button>
          </div>
        </div>

        <button className="btn btn-primary btn-lg w-full mt-1" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </button>

        <p className="text-sm text-center text-[var(--color-ink-muted)]">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-[var(--color-gold-dark)] font-medium underline underline-offset-2">
            Créer un compte
          </Link>
        </p>
      </form>

      {/* Accès rapide aux comptes de démonstration (mode vitrine uniquement) */}
      {process.env.NEXT_PUBLIC_DEMO === "1" && (
      <div className="mt-8 pt-6 border-t border-[var(--color-sand)]">
        <p className="label text-center mb-3">{team ? "Accès de l'équipe" : "Essayer sans créer de compte"}</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {accounts.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword("Demo2026!");
              }}
              className="chip bg-[var(--color-cream-deep)] text-[var(--color-ink-soft)] hover:bg-[var(--color-gold-pale)] hover:text-[var(--color-gold-dark)] transition-colors cursor-pointer"
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-center text-[var(--color-ink-muted)] mt-2">
          Mot de passe commun : <code className="font-mono">Demo2026!</code>
        </p>
      </div>
      )}
    </div>
  );
}

export function RegisterForm({ defaultType = "CLIENT" }: { defaultType?: "CLIENT" | "VENDEUR" }) {
  const [state, onSubmit, pending] = useStickyAction(registerAction, undefined);
  const [type, setType] = useState<"CLIENT" | "VENDEUR">(defaultType);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {state?.error && <Alert tone="danger">{state.error}</Alert>}

      <input type="hidden" name="accountType" value={type} />
      <fieldset>
        <legend className="label mb-2">Qui êtes-vous ?</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(
            [
              {
                key: "CLIENT",
                label: "J'achète",
                icon: "cart",
                hint: "Meubles, sacs, bonnes affaires — livrés chez vous.",
              },
              {
                key: "VENDEUR",
                label: "Je vends",
                icon: "tag",
                hint: "Vos articles dans le fourre-tout, paiement garanti.",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              aria-pressed={type === t.key}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                type === t.key
                  ? "border-[var(--color-gold-dark)] bg-[var(--color-gold-pale)] text-[var(--color-ink)]"
                  : "border-[var(--color-sand)] bg-[var(--color-linen)] text-[var(--color-ink-soft)] hover:bg-[var(--color-cream-deep)]"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon name={t.icon} size={16} /> {t.label}
              </span>
              <span className="text-[11px] text-[var(--color-ink-muted)]">{t.hint}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[var(--color-ink-muted)] mt-2">
          Ce choix n'enferme personne : un acheteur peut ouvrir une boutique plus tard, un vendeur achète
          comme tout le monde. Le compte est le même.
        </p>
      </fieldset>

      {type === "VENDEUR" && (
        <>
          <Alert tone="info">
            Vous vendrez dans le <strong>fourre-tout</strong> : les acheteurs vous paient via Le Beau Défaut,
            qui vous reverse après la livraison. Le mobilier et les sacs de luxe, eux, nous les achetons avant
            de les revendre — dites-le nous et nous viendrons voir votre lot.
          </Alert>
          <div>
            <label className="label" htmlFor="shopName">
              Nom de la boutique
            </label>
            <input id="shopName" name="shopName" className="field" placeholder="Ex. Maison Mbemba Mobilier" required />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="firstName">
            Prénom
          </label>
          <input id="firstName" name="firstName" autoComplete="given-name" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="lastName">
            Nom
          </label>
          <input id="lastName" name="lastName" autoComplete="family-name" className="field" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="email">
            E-mail
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="field"
            placeholder="06 612 34 56"
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="city">
          Ville
        </label>
        <select id="city" name="city" className="field" defaultValue="Brazzaville">
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="field"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirmation
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="field"
            required
          />
        </div>
      </div>

      <button className="btn btn-gold btn-lg w-full mt-1" disabled={pending}>
        {pending ? "Création…" : type === "VENDEUR" ? "Ouvrir ma boutique" : "Créer mon compte"}
      </button>

      <p className="text-sm text-center text-[var(--color-ink-muted)]">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="text-[var(--color-gold-dark)] font-medium underline underline-offset-2">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
