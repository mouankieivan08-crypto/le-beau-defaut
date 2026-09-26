import Link from "next/link";
import { Breadcrumb } from "./ui";

/** Mise en page commune aux pages légales : une colonne étroite, faite pour être lue. */
export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 md:py-12">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: title }]} />

      <h1 className="font-display text-[32px] sm:text-[38px] font-bold leading-tight mt-2">{title}</h1>
      <p className="text-xs text-[var(--color-ink-muted)] mt-2">Dernière mise à jour : {updated}</p>
      {intro && <p className="text-[15px] text-[var(--color-ink-soft)] mt-4 leading-relaxed">{intro}</p>}

      <div className="mt-8 flex flex-col gap-7">{children}</div>

      <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-[var(--color-sand)]">
        {[
          ["Mentions légales", "/mentions-legales"],
          ["Confidentialité", "/confidentialite"],
          ["Conditions", "/conditions"],
          ["Aide", "/aide"],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="chip bg-[var(--color-cream-deep)] text-[var(--color-ink-soft)] hover:bg-[var(--color-sand)]">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold mb-2">{title}</h2>
      <div className="text-sm text-[var(--color-ink-soft)] leading-relaxed flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

/** Une information que Le Beau Défaut doit compléter quand elle sera connue. */
export function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-[var(--color-gold-pale)] px-1.5 py-0.5 text-[13px] text-[var(--color-gold-deep)]">
      {children}
    </span>
  );
}
