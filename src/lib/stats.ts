/** Agrégations pour les tableaux de bord. */

const DAY = 24 * 60 * 60 * 1000;

export function daysAgo(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() - n * DAY);
}

/** Début de semaine (lundi 00:00). */
function weekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  return new Date(d.getTime() - day * DAY);
}

/**
 * Somme hebdomadaire sur N semaines glissantes, la plus récente en dernier.
 * Libellé = date du lundi (« 8 sept. »).
 */
export function weeklySeries(rows: { date: Date; amount: number }[], weeks = 12) {
  const current = weekStart(new Date());
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(current.getTime() - (weeks - 1 - i) * 7 * DAY);
    return { start, value: 0, count: 0 };
  });
  for (const r of rows) {
    const ws = weekStart(r.date).getTime();
    const b = buckets.find((x) => x.start.getTime() === ws);
    if (b) {
      b.value += r.amount;
      b.count += 1;
    }
  }
  return buckets.map((b) => ({
    label: b.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Africa/Brazzaville" }),
    value: b.value,
    detail: `Semaine du ${b.start.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Africa/Brazzaville" })} · ${b.count} commande${b.count > 1 ? "s" : ""}`,
  }));
}

/** Variation en % entre deux périodes (null si pas de base de comparaison). */
export function deltaPct(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const LIVE_ORDER = { status: { notIn: ["ANNULEE", "REMBOURSEE"] } };
