import Link from "next/link";
import Icon, { type IconName } from "./Icon";
import { TONE_CLASSES, gradeOf } from "@/lib/constants";
import { money } from "@/lib/format";

/* ---------------------------- Badges ---------------------------- */

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE_CLASSES | string;
  className?: string;
}) {
  return <span className={`chip ${TONE_CLASSES[tone] ?? TONE_CLASSES.neutral} ${className}`}>{children}</span>;
}

/** Pastille de grade — la signature visuelle du concept. */
export function GradeBadge({
  grade,
  size = "md",
  withName = false,
}: {
  grade: string;
  size?: "sm" | "md" | "lg";
  withName?: boolean;
}) {
  const g = gradeOf(grade);
  const dim = size === "sm" ? 20 : size === "lg" ? 34 : 26;
  const fs = size === "sm" ? 10 : size === "lg" ? 15 : 12;
  return (
    <span className="inline-flex items-center gap-2" title={`${g.label} — ${g.name}`}>
      <span
        className="inline-flex items-center justify-center rounded-full font-bold font-display"
        style={{
          width: dim,
          height: dim,
          fontSize: fs,
          background: g.bg,
          color: g.color,
          border: `1.5px solid ${g.color}`,
        }}
      >
        {g.key}
      </span>
      {withName && (
        <span className="text-xs font-medium" style={{ color: g.color }}>
          {g.name}
        </span>
      )}
    </span>
  );
}

/* ---------------------------- Prix ---------------------------- */

export function Price({
  price,
  original,
  size = "md",
}: {
  price: number;
  original?: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const cls = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  const show = original && original > price;
  return (
    <span className="inline-flex items-baseline gap-2 flex-wrap">
      <span className={`font-display font-bold ${cls}`}>{money(price)}</span>
      {show && (
        <span className="text-xs text-[var(--color-ink-muted)] line-through">{money(original!, false)}</span>
      )}
    </span>
  );
}

export function DiscountTag({ pct }: { pct: number }) {
  if (!pct || pct <= 0) return null;
  return (
    <span className="chip bg-[var(--color-ink)] text-[var(--color-cream)] font-bold">−{pct} %</span>
  );
}

/* ---------------------------- Structure ---------------------------- */

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-dark)] mb-1.5">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl md:text-[28px] font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--color-ink-muted)] mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: IconName;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-gold-pale)] text-[var(--color-gold-dark)]">
            <Icon name={icon} size={18} />
          </span>
        )}
        <div>
          <h1 className="text-[26px] font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <div className={`surface ${padded ? "p-5" : ""} ${className}`}>{children}</div>;
}

export function EmptyState({
  icon = "box",
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface py-14 px-6 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-cream-deep)] text-[var(--color-ink-muted)] mb-4">
        <Icon name={icon} size={24} />
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {message && <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 max-w-md mx-auto">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------- Indicateurs ---------------------------- */

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  href,
  delta,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconName;
  tone?: "neutral" | "gold" | "success" | "danger" | "info";
  href?: string;
  /** Variation signée vs une période nommée ; la couleur suit « hausse = bien ? » */
  delta?: { pct: number | null; vs: string; upIsGood?: boolean };
}) {
  const accents: Record<string, string> = {
    neutral: "var(--color-ink)",
    gold: "var(--color-gold-deep)",
    success: "var(--color-success)",
    danger: "var(--color-danger)",
    info: "var(--color-info)",
  };
  const body = (
    <div className="surface surface-hover p-4 h-full">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-ink-muted)]">
          {label}
        </p>
        {icon && (
          <span style={{ color: accents[tone] }} className="opacity-70">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <p className="font-sans text-[26px] font-semibold tracking-tight mt-1.5 leading-none" style={{ color: accents[tone] }}>
        {value}
      </p>
      {delta && delta.pct !== null && (
        <p className="text-[11px] mt-1.5 flex items-center gap-1 text-[var(--color-ink-muted)]">
          <span
            className="inline-flex items-center gap-0.5 font-semibold"
            style={{
              color:
                delta.pct === 0
                  ? "var(--color-ink-muted)"
                  : (delta.pct > 0) === (delta.upIsGood ?? true)
                    ? "var(--color-success)"
                    : "var(--color-danger)",
            }}
          >
            {delta.pct > 0 ? "▲" : delta.pct < 0 ? "▼" : "■"} {delta.pct > 0 ? "+" : ""}
            {delta.pct} %
          </span>
          {delta.vs}
        </p>
      )}
      {hint && <p className="text-[11px] text-[var(--color-ink-muted)] mt-1.5">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Rating({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[var(--color-gold)]">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name={i <= Math.round(value) ? "star-filled" : "star"} size={size} />
      ))}
      {count !== undefined && (
        <span className="text-[11px] text-[var(--color-ink-muted)] ml-0.5">({count})</span>
      )}
    </span>
  );
}

/** Barre de progression d'une commande. */
export function Steps({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="flex items-center gap-1 w-full">
      {labels.map((l, i) => {
        const done = i <= current;
        return (
          <li key={l} className="flex-1 min-w-0">
            <div
              className="h-1.5 rounded-full transition-colors"
              style={{ background: done ? "var(--color-gold)" : "var(--color-sand)" }}
            />
            <p
              className={`mt-1.5 text-[10px] leading-tight truncate ${
                done ? "text-[var(--color-ink)] font-medium" : "text-[var(--color-ink-muted)]"
              }`}
            >
              {l}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------------------- Divers ---------------------------- */

export function Avatar({
  first,
  last,
  url,
  size = 36,
}: {
  first: string;
  last: string;
  url?: string | null;
  size?: number;
}) {
  if (url)
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-[var(--color-gold-pale)] text-[var(--color-gold-dark)] font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {`${(first || "?")[0]}${(last || "")[0] || ""}`.toUpperCase()}
    </span>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: React.ReactNode;
}) {
  const map = {
    info: { bg: "#e7eef3", fg: "var(--color-info)", icon: "info" as IconName },
    success: { bg: "var(--color-grade-a-bg)", fg: "var(--color-success)", icon: "check-circle" as IconName },
    warning: { bg: "var(--color-grade-b-bg)", fg: "var(--color-gold-dark)", icon: "alert" as IconName },
    danger: { bg: "var(--color-grade-c-bg)", fg: "var(--color-danger)", icon: "alert" as IconName },
  }[tone];
  return (
    <div className="flex gap-3 rounded-xl p-3.5 text-sm" style={{ background: map.bg, color: map.fg }}>
      <span className="mt-0.5">
        <Icon name={map.icon} size={17} />
      </span>
      <div className="min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="opacity-90">{children}</div>
      </div>
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] mb-5 flex-wrap">
      {items.map((it, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <Icon name="chevron-right" size={12} className="opacity-50" />}
          {it.href ? (
            <Link href={it.href} className="hover:text-[var(--color-gold-dark)] transition-colors">
              {it.label}
            </Link>
          ) : (
            <span className="text-[var(--color-ink)]">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
