import Icon from "./Icon";
import { GradeBadge } from "./ui";
import { defectTypeLabel, SEVERITY_LABELS, gradeOf } from "@/lib/constants";

export type DefectRow = {
  id: string;
  type: string;
  zone: string;
  severity: number;
  description: string;
  photoUrl: string | null;
  repairable: boolean;
  repairNote: string | null;
};

/**
 * Le rapport du défaut : le bloc qui justifie le nom de l'enseigne.
 * On ne cache rien — type, zone, sévérité, photo, réparabilité.
 */
export default function DefectReport({
  grade,
  summary,
  defects,
  discountPct,
}: {
  grade: string;
  summary: string;
  defects: DefectRow[];
  discountPct: number;
}) {
  const g = gradeOf(grade);

  return (
    <section
      className="surface overflow-hidden"
      style={{ borderColor: `color-mix(in srgb, ${g.color} 35%, transparent)` }}
    >
      <header
        className="px-5 py-4 flex items-start justify-between gap-4 flex-wrap"
        style={{ background: g.bg }}
      >
        <div className="flex items-start gap-3">
          <GradeBadge grade={grade} size="lg" />
          <div>
            <h2 className="font-display text-lg font-bold" style={{ color: g.color }}>
              Le rapport du défaut
            </h2>
            <p className="text-xs mt-0.5" style={{ color: g.color, opacity: 0.85 }}>
              {g.label} · {g.name} — {defects.length} défaut{defects.length > 1 ? "s" : ""} déclaré
              {defects.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span className="chip font-bold" style={{ background: g.color, color: "#fff" }}>
          −{discountPct} % sur le prix neuf
        </span>
      </header>

      <div className="p-5">
        <p className="text-[15px] font-medium leading-relaxed mb-5 pb-5 border-b border-[var(--color-sand)]">
          {summary}
        </p>

        <ul className="flex flex-col gap-4">
          {defects.map((d) => (
            <li key={d.id} className="flex gap-4">
              {d.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photoUrl}
                  alt={`Défaut : ${d.zone}`}
                  className="h-20 w-20 rounded-lg object-cover shrink-0 border border-[var(--color-sand)]"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="chip bg-[var(--color-cream-deep)] text-[var(--color-ink)] font-semibold">
                    {defectTypeLabel(d.type)}
                  </span>
                  <span className="text-xs text-[var(--color-ink-muted)] inline-flex items-center gap-1">
                    <Icon name="pin" size={11} /> {d.zone}
                  </span>
                </div>

                <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">{d.description}</p>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="flex gap-0.5" aria-label={`Sévérité ${d.severity} sur 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className="h-1.5 w-5 rounded-full"
                          style={{
                            background: n <= d.severity ? g.color : "var(--color-sand)",
                          }}
                        />
                      ))}
                    </span>
                    <span className="text-[11px] text-[var(--color-ink-muted)]">
                      {SEVERITY_LABELS[d.severity]}
                    </span>
                  </span>

                  {d.repairable && (
                    <span className="chip bg-[var(--color-grade-a-bg)] text-[var(--color-grade-a)]">
                      <Icon name="check" size={10} /> Réparable
                    </span>
                  )}
                </div>

                {d.repairNote && (
                  <p className="text-[11.5px] text-[var(--color-ink-muted)] mt-1.5 italic">
                    {d.repairNote}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="flex items-start gap-2 text-[11.5px] text-[var(--color-ink-muted)] mt-5 pt-4 border-t border-[var(--color-sand)] leading-relaxed">
          <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-[var(--color-gold)]" />
          <span>
            Si l&apos;article reçu présente un défaut non listé ici, il est repris. C&apos;est la seule
            garantie qui compte chez nous : <strong>ce qui est annoncé est ce que vous recevez</strong>.
          </span>
        </p>
      </div>
    </section>
  );
}
