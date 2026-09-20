import Logo from "./Logo";
import Icon from "./Icon";
import { GRADE_LIST } from "@/lib/constants";
import { GradeBadge } from "./ui";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 lg:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] surface overflow-hidden">
        {/* Colonne marque */}
        <aside className="hidden lg:flex flex-col justify-between bg-[var(--color-ink)] text-[var(--color-cream)] p-10 relative overflow-hidden">
          <span className="absolute -right-24 -bottom-24 text-[var(--color-gold)] opacity-[0.06]">
            <Icon name="sparkle" size={380} strokeWidth={0.4} />
          </span>
          <div className="relative">
            <Logo size={64} variant="mark" onDark />
            <p className="font-display text-3xl font-bold uppercase tracking-wide mt-6 leading-tight">
              Le Beau
              <br />
              <span className="text-gilded">Défaut</span>
            </p>
            <div className="rule-gold my-5 max-w-[220px] opacity-60" />
            <p className="font-script text-gilded text-[28px] leading-tight">
              Les petits défauts font
              <br />
              de grandes économies
            </p>
          </div>

          <ul className="relative flex flex-col gap-4 mt-10">
            {GRADE_LIST.map((g) => (
              <li key={g.key} className="flex items-start gap-3">
                <GradeBadge grade={g.key} />
                <div>
                  <p className="text-sm font-semibold">{g.name}</p>
                  <p className="text-xs text-[var(--color-cream)]/55">
                    Remise de {g.minDiscount} à {g.maxDiscount} %
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Colonne formulaire */}
        <div className="p-7 sm:p-10">
          <div className="lg:hidden mb-6">
            <Logo size={44} variant="full" />
          </div>
          <h1 className="font-display text-[28px] font-bold leading-tight">{title}</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
