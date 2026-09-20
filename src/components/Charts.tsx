"use client";

/**
 * Graphiques du tableau de bord — SVG sans dépendance.
 *
 * Règles appliquées (voir docs/DESIGN.md › Données) :
 *  - marques fines : colonnes ≤ 24 px, extrémité arrondie 4 px, base carrée ;
 *  - grille en filet plein 1 px, discrète ; une seule échelle par graphique ;
 *  - étiquettes directes sélectives (maximum + dernière valeur), jamais partout ;
 *  - infobulle au survol ET au focus clavier, zone de survol plus large que la marque ;
 *  - chaque graphique a sa vue tableau ; le texte ne prend jamais la couleur de la série.
 */

import { useEffect, useRef, useState } from "react";

const INK = "var(--color-ink)";
const MUTED = "var(--color-ink-muted)";
const GRID = "var(--color-viz-grid)";

export type Datum = { label: string; value: number; detail?: string };
export type Unit = "fcfa" | "count" | "pct";

const nf = new Intl.NumberFormat("fr-FR");
function formatter(unit: Unit) {
  if (unit === "count") return (n: number) => nf.format(n);
  if (unit === "pct") return (n: number) => `${nf.format(n)} %`;
  return (n: number) => `${nf.format(n)} FCFA`;
}

/* ------------------------------------------------------------------ utilitaires */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Graduations « rondes » : 0 / 250 k / 500 k … */
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return ticks;
}

function compact(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1).replace(".", ",").replace(",0", "")} M`;
  if (a >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(Math.round(n));
}

function Tooltip({ x, y, value, label, detail }: { x: number; y: number; value: string; label: string; detail?: string }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg px-3 py-2 text-left shadow-[var(--shadow-lift)]"
      style={{ left: x, top: y - 10, background: "var(--color-ink)", color: "var(--color-cream)", minWidth: 110 }}
    >
      <p className="text-sm font-semibold leading-tight whitespace-nowrap">{value}</p>
      <p className="text-[11px] opacity-70 whitespace-nowrap mt-0.5">{label}</p>
      {detail && <p className="text-[11px] opacity-70 whitespace-nowrap">{detail}</p>}
    </div>
  );
}

function TableView({ caption, rows, format }: { caption: string; rows: Datum[]; format: (n: number) => string }) {
  return (
    <details className="mt-3 group">
      <summary className="text-xs text-[var(--color-ink-muted)] cursor-pointer hover:text-[var(--color-ink)] select-none w-fit">
        Voir les données en tableau
      </summary>
      <div className="overflow-x-auto mt-2">
        <table className="table-lbd">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Période / catégorie</th>
              <th scope="col" className="!text-right">
                Valeur
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>
                  {r.label}
                  {r.detail && <span className="text-[var(--color-ink-muted)]"> · {r.detail}</span>}
                </td>
                <td className="text-right" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {format(r.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ colonnes */

export function ColumnChart({
  data,
  color = "var(--color-viz-mobilier)",
  unit = "fcfa",
  height = 220,
  caption,
}: {
  data: Datum[];
  color?: string;
  unit?: Unit;
  height?: number;
  caption: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const format = formatter(unit);

  const padL = 44;
  const padR = 8;
  const padT = 22;
  const axisH = 26;
  const plotH = height - padT - axisH;
  const plotW = Math.max(0, width - padL - padR);

  const max = Math.max(0, ...data.map((d) => d.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.min(24, Math.max(4, band * 0.62));
  const y = (v: number) => padT + plotH - (v / top) * plotH;

  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const lastIdx = data.length - 1;
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56)));

  return (
    <div>
      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={caption} className="overflow-visible">
            {/* grille */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text
                  x={padL - 8}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={10.5}
                  fill={MUTED}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {compact(t)}
                </text>
              </g>
            ))}

            {data.map((d, i) => {
              const cx = padL + band * i + band / 2;
              const x = cx - barW / 2;
              const yTop = y(d.value);
              const h = padT + plotH - yTop;
              const r = Math.min(4, h, barW / 2);
              const base = padT + plotH;
              const path =
                h <= 0
                  ? ""
                  : `M${x},${base} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${base} Z`;
              const showValue = d.value > 0 && (i === maxIdx || i === lastIdx);
              const isActive = active === i;

              return (
                <g key={d.label}>
                  {path && (
                    <path
                      d={path}
                      fill={color}
                      opacity={active === null || isActive ? 1 : 0.45}
                      style={{ transition: "opacity .15s" }}
                    />
                  )}
                  {showValue && (
                    <text x={cx} y={yTop - 6} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={INK}>
                      {compact(d.value)}
                    </text>
                  )}
                  {(i % labelEvery === 0 || i === lastIdx) && (
                    <text x={cx} y={base + 17} textAnchor="middle" fontSize={10.5} fill={MUTED}>
                      {d.label}
                    </text>
                  )}
                  {/* zone de survol : toute la bande, plus large que la marque */}
                  <rect
                    x={padL + band * i}
                    y={padT}
                    width={band}
                    height={plotH}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${d.label} : ${format(d.value)}`}
                    onPointerEnter={() => setActive(i)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    style={{ outline: "none", cursor: "default" }}
                  />
                </g>
              );
            })}

            <line
              x1={padL}
              x2={width - padR}
              y1={padT + plotH}
              y2={padT + plotH}
              stroke="var(--color-sand)"
              strokeWidth={1}
            />
          </svg>
        )}

        {active !== null && data[active] && width > 0 && (
          <Tooltip
            x={padL + band * active + band / 2}
            y={y(data[active].value)}
            value={format(data[active].value)}
            label={data[active].label}
            detail={data[active].detail}
          />
        )}
      </div>
      <TableView caption={caption} rows={data} format={format} />
    </div>
  );
}

/* ------------------------------------------------------------------ répartition */

export type Share = { key: string; label: string; value: number; color: string; detail?: string };

/**
 * Barre 100 % empilée pour une répartition (≤ 3-4 parts).
 * Légende toujours présente ; valeur inscrite dans le segment seulement si elle tient.
 */
export function ShareBar({
  parts,
  unit = "fcfa",
  caption,
}: {
  parts: Share[];
  unit?: Unit;
  caption: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const format = formatter(unit);
  const total = parts.reduce((s, p) => s + p.value, 0);
  const GAP = 2;
  const H = 28;

  let cursor = 0;
  const segs = parts.map((p) => {
    const w = total > 0 ? (p.value / total) * width : 0;
    const seg = { ...p, x: cursor, w, pct: total > 0 ? Math.round((p.value / total) * 100) : 0 };
    cursor += w;
    return seg;
  });
  const visible = segs.filter((s) => s.w > 0);

  return (
    <div>
      <div ref={ref} className="relative w-full" style={{ height: H }}>
        {width > 0 && total > 0 && (
          <svg width={width} height={H} role="img" aria-label={caption}>
            {segs.map((s, i) => {
              if (s.w <= 0) return null;
              const isFirst = s === visible[0];
              const isLast = s === visible[visible.length - 1];
              const x = s.x + (isFirst ? 0 : GAP / 2);
              const w = Math.max(0, s.w - (isFirst ? 0 : GAP / 2) - (isLast ? 0 : GAP / 2));
              const label = `${s.pct} %`;
              const fits = w >= label.length * 7 + 16;
              // Encre sur l'or (clair), blanc sur les teintes foncées.
              const textFill = s.key === "MOBILIER" ? "#14110e" : "#ffffff";
              return (
                <g key={s.key}>
                  <rect
                    x={x}
                    y={0}
                    width={w}
                    height={H}
                    rx={isFirst || isLast ? 4 : 0}
                    fill={s.color}
                    opacity={active === null || active === i ? 1 : 0.5}
                    tabIndex={0}
                    aria-label={`${s.label} : ${format(s.value)} (${s.pct} %)`}
                    onPointerEnter={() => setActive(i)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    style={{ outline: "none", transition: "opacity .15s" }}
                  />
                  {fits && (
                    <text
                      x={x + w / 2}
                      y={H / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fontWeight={600}
                      fill={textFill}
                      pointerEvents="none"
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
        {total === 0 && (
          <div className="h-full rounded bg-[var(--color-cream-deep)] grid place-items-center text-xs text-[var(--color-ink-muted)]">
            Pas encore de données
          </div>
        )}
        {active !== null && segs[active] && (
          <Tooltip
            x={segs[active].x + segs[active].w / 2}
            y={0}
            value={format(segs[active].value)}
            label={`${segs[active].label} · ${segs[active].pct} %`}
            detail={segs[active].detail}
          />
        )}
      </div>

      {/* Légende : pastille de couleur + texte à l'encre */}
      <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
            <span className="text-[var(--color-ink-soft)]">{s.label}</span>
            <span className="font-semibold text-[var(--color-ink)]">{s.pct} %</span>
          </li>
        ))}
      </ul>
      <TableView
        caption={caption}
        rows={parts.map((p) => ({ label: p.label, value: p.value, detail: p.detail }))}
        format={format}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ barres horizontales */

/** Classement simple (une seule série → une seule couleur), valeur au bout de chaque barre. */
export function BarList({
  rows,
  color = "var(--color-viz-mobilier)",
  unit = "count",
  caption,
  prefix,
}: {
  rows: (Datum & { key: string })[];
  color?: string;
  unit?: Unit;
  caption: string;
  /** élément affiché avant le libellé (ex. pastille de grade) */
  prefix?: Record<string, React.ReactNode>;
}) {
  const [active, setActive] = useState<string | null>(null);
  const format = formatter(unit);
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div>
      <ul className="flex flex-col gap-3" aria-label={caption}>
        {rows.map((r) => {
          const pct = (r.value / max) * 100;
          return (
            <li
              key={r.key}
              tabIndex={0}
              onPointerEnter={() => setActive(r.key)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(r.key)}
              onBlur={() => setActive(null)}
              className="relative outline-none rounded-md focus-visible:ring-2 focus-visible:ring-[var(--color-gold-light)]"
              aria-label={`${r.label} : ${format(r.value)}`}
            >
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)] min-w-0">
                  {prefix?.[r.key]}
                  <span className="truncate">{r.label}</span>
                </span>
                <span className="text-sm font-semibold text-[var(--color-ink)] shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {format(r.value)}
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "var(--color-cream-deep)" }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max(pct, r.value > 0 ? 2 : 0)}%`,
                    background: color,
                    opacity: active === null || active === r.key ? 1 : 0.5,
                    transition: "opacity .15s, width .4s",
                  }}
                />
              </div>
              {active === r.key && r.detail && (
                <div
                  role="status"
                  className="absolute right-0 -top-2 -translate-y-full rounded-lg px-3 py-1.5 text-[11px] shadow-[var(--shadow-lift)] z-10 whitespace-nowrap"
                  style={{ background: "var(--color-ink)", color: "var(--color-cream)" }}
                >
                  {r.detail}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

