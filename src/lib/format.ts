import { CURRENCY } from "./constants";

/** 125000 -> "125 000 FCFA" */
export function money(amount: number, withCurrency = true): string {
  const n = new Intl.NumberFormat("fr-FR").format(Math.round(amount || 0));
  return withCurrency ? `${n} ${CURRENCY}` : n;
}

/** Version compacte pour les tableaux de bord : 1 250 000 -> "1,25 M" */
export function moneyCompact(amount: number): string {
  const a = Math.round(amount || 0);
  // 19.0 -> "19" ; 1.20 -> "1,2" ; 19.5 -> "19,5"
  const fmt = (n: number, digits: number) =>
    n.toFixed(digits).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "").replace(".", ",");
  if (a >= 1_000_000) return `${fmt(a / 1_000_000, a >= 10_000_000 ? 0 : 2)} M`;
  if (a >= 1_000) return `${fmt(a / 1_000, a >= 100_000 ? 0 : 1)} k`;
  return String(a);
}

export function discountPct(original: number, price: number): number {
  if (!original || original <= 0 || price >= original) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function dateFR(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function dateTimeFR(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeFR(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  if (j === 1) return "hier";
  if (j < 30) return `il y a ${j} jours`;
  return dateFR(d);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function initials(first: string, last: string): string {
  return `${(first || "?")[0]}${(last || "")[0] || ""}`.toUpperCase();
}

/** Téléphone congolais : 066123456 -> "06 61 23 456" */
export function phoneFR(p: string | null | undefined): string {
  if (!p) return "—";
  const digits = p.replace(/\D/g, "");
  if (digits.length === 9) return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{3})/, "$1 $2 $3 $4");
  return p;
}

/**
 * Lien WhatsApp (wa.me) avec message pré-rempli.
 * Les numéros congolais sont stockés au format local (9 chiffres) : on préfixe l'indicatif 242.
 */
export function waLink(phone: string | null | undefined, text?: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (!digits.startsWith("242")) digits = `242${digits}`;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
