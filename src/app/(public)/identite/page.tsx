import type { Metadata } from "next";
import Logo, { Monogram } from "@/components/Logo";
import Icon from "@/components/Icon";
import { GradeBadge, Badge, Breadcrumb } from "@/components/ui";
import { GRADE_LIST, BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Identité visuelle",
  description: "Logo, couleurs, typographies et règles graphiques de Le Beau Défaut.",
};

const PALETTE = [
  { name: "Encre", hex: "#14110E", token: "--color-ink", use: "Textes, boutons principaux, fonds sombres", dark: true },
  { name: "Ivoire", hex: "#FAF5EC", token: "--color-cream", use: "Fond de page — la toile du logo" },
  { name: "Lin", hex: "#FFFDF8", token: "--color-linen", use: "Cartes et surfaces" },
  { name: "Sable", hex: "#E9DCC6", token: "--color-sand", use: "Filets, bordures, séparateurs" },
  { name: "Or", hex: "#B8913C", token: "--color-gold", use: "Le « B », filets, étoile — décor uniquement", dark: true },
  { name: "Or profond", hex: "#7D5E1F", token: "--color-gold-deep", use: "Or lisible en texte et boutons dorés (AA)", dark: true },
  { name: "Or pâle", hex: "#F0E2BE", token: "--color-gold-pale", use: "Pastilles, fonds d'icônes" },
  { name: "Blush", hex: "#D8A594", token: "--color-blush", use: "Accent chaleureux, avec parcimonie" },
];

const GRADIENT = "linear-gradient(135deg,#8C6A24 0%,#C9A227 28%,#F0DCA0 52%,#C9A227 74%,#8C6A24 100%)";

export default function IdentityPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Identité visuelle" }]} />

      <header className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-deep)] mb-2">
          Charte graphique
        </p>
        <h1 className="font-display text-[40px] font-bold leading-tight">Identité visuelle</h1>
        <p className="text-[15px] text-[var(--color-ink-soft)] mt-2 max-w-2xl leading-relaxed">
          Tout part du monogramme : trois lettres qui se chevauchent sans se gêner, comme un meuble dont le
          défaut ne change rien à l&apos;élégance. L&apos;ivoire sert de toile, l&apos;encre structure, l&apos;or
          souligne — jamais plus d&apos;un élément doré par zone.
        </p>
      </header>

      {/* ------------ Logo ------------ */}
      <Section title="Le logo" subtitle="Version complète, horizontale et monogramme seul.">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
          <div className="surface grid place-items-center py-14 px-6">
            <Logo variant="lockup" size={200} />
          </div>
          <div className="grid gap-5">
            <div className="rounded-[14px] bg-[var(--color-ink)] grid place-items-center py-10 px-6">
              <Logo variant="full" size={64} onDark />
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div className="surface grid place-items-center py-6">
                <Monogram size={96} />
              </div>
              <div className="rounded-[14px] bg-[var(--color-ink)] grid place-items-center py-6">
                <Monogram size={96} onDark />
              </div>
              <div className="rounded-[14px] grid place-items-center py-6" style={{ background: "#F0E2BE" }}>
                <Monogram size={96} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          <Rule icon="check-circle" title="Zone de protection">
            Laisser autour du logo un espace libre au moins égal à la hauteur du « B ».
          </Rule>
          <Rule icon="check-circle" title="Taille minimale">
            Monogramme : 24 px à l&apos;écran, 8 mm en impression. En dessous, utiliser le « B » seul.
          </Rule>
          <Rule icon="alert" title="À éviter" danger>
            Recolorer les lettres, étirer, ajouter une ombre, ou poser le logo sur une photo chargée.
          </Rule>
        </div>

        <div className="flex flex-wrap gap-2 mt-5">
          {[
            ["Monogramme", "/brand/lbd-monogramme.svg"],
            ["Monogramme fond sombre", "/brand/lbd-monogramme-sombre.svg"],
            ["Logo horizontal", "/brand/lbd-logo-horizontal.svg"],
            ["Logo complet", "/brand/lbd-logo-complet.svg"],
          ].map(([label, href]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <Icon name="download" size={14} /> {label} (SVG)
            </a>
          ))}
        </div>
      </Section>

      {/* ------------ Couleurs ------------ */}
      <Section title="Couleurs" subtitle="Des neutres chauds, une encre profonde et un or qui se mérite.">
        <div className="surface overflow-hidden mb-5">
          <div className="h-24" style={{ background: GRADIENT }} />
          <div className="p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">Dégradé or du monogramme</p>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Réservé au logo, à l&apos;étoile et aux titres signature. Jamais en fond de bouton ou de texte courant.
              </p>
            </div>
            <code className="text-[11px] text-[var(--color-ink-muted)] font-mono">#8C6A24 → #C9A227 → #F0DCA0</code>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PALETTE.map((c) => (
            <div key={c.hex} className="surface overflow-hidden">
              <div
                className="h-20 flex items-end p-3"
                style={{ background: c.hex, color: c.dark ? "#FAF5EC" : "#14110E" }}
              >
                <span className="font-mono text-xs">{c.hex}</span>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug mt-0.5">{c.use}</p>
                <code className="text-[10px] text-[var(--color-ink-muted)] font-mono">{c.token}</code>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------ Typographies ------------ */}
      <Section title="Typographies" subtitle="Trois voix, chacune à sa place.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="surface p-6">
            <p className="label">Titres</p>
            <p className="font-display text-[44px] font-bold leading-none">Aa</p>
            <p className="font-display text-xl font-semibold mt-3">Playfair Display</p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">
              Didone à fort contraste, cousine des lettres du monogramme. Titres, noms d&apos;articles, prix.
            </p>
          </div>
          <div className="surface p-6">
            <p className="label">Interface</p>
            <p className="font-sans text-[44px] font-semibold leading-none">Aa</p>
            <p className="font-sans text-xl font-semibold mt-3">Inter</p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">
              Textes courants, formulaires, tableaux, chiffres des tableaux de bord.
            </p>
          </div>
          <div className="surface p-6">
            <p className="label">Signature</p>
            <p className="font-script text-gilded text-[52px] leading-none">Aa</p>
            <p className="font-script text-[28px] mt-2 leading-none">Parisienne</p>
            <p className="text-sm text-[var(--color-ink-muted)] mt-1">
              Uniquement pour la promesse « {BRAND.tagline} » et les mots doux. Jamais pour une information.
            </p>
          </div>
        </div>
      </Section>

      {/* ------------ Grille du défaut ------------ */}
      <Section title="La grille du défaut" subtitle="Le système visuel propre à la marque : une lettre, une couleur, une remise.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {GRADE_LIST.map((g) => (
            <div key={g.key} className="surface p-5 border-t-[3px]" style={{ borderTopColor: g.color }}>
              <div className="flex items-center gap-3 mb-3">
                <GradeBadge grade={g.key} size="sm" />
                <GradeBadge grade={g.key} />
                <GradeBadge grade={g.key} size="lg" />
              </div>
              <p className="font-display font-bold">
                {g.label} · {g.name}
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                Remise {g.minDiscount} à {g.maxDiscount} % · texte {g.key === "A" ? "#276B4E" : g.key === "B" ? "#7D5E1F" : "#A34E2D"}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] mt-3">
          La lettre accompagne toujours la couleur : le grade reste lisible pour les personnes daltoniennes et en
          impression noir et blanc.
        </p>
      </Section>

      {/* ------------ Éléments ------------ */}
      <Section title="Éléments d'interface" subtitle="Boutons, pastilles et filet doré.">
        <div className="surface p-6 flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary">Action principale</button>
            <button className="btn btn-gold">Action signature</button>
            <button className="btn btn-outline">Secondaire</button>
            <button className="btn btn-ghost">Discrète</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">Publiée</Badge>
            <Badge tone="warning">En attente</Badge>
            <Badge tone="danger">Rejetée</Badge>
            <Badge tone="info">En livraison</Badge>
            <Badge tone="neutral">Brouillon</Badge>
            <span className="chip bg-[var(--color-ink)] text-[var(--color-cream)]">−35 %</span>
          </div>
          <div>
            <div className="rule-gold" />
            <p className="text-xs text-[var(--color-ink-muted)] mt-2">
              Le filet doré, repris sous le nom dans le logo, sépare les zones importantes (prix, récapitulatifs).
            </p>
          </div>
        </div>
      </Section>

      {/* ------------ Ton ------------ */}
      <Section title="Ton de voix" subtitle="On parle du défaut comme d'un détail, jamais comme d'une excuse.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="surface p-5">
            <p className="label flex items-center gap-1.5 !text-[var(--color-success)]">
              <Icon name="check" size={13} /> On écrit
            </p>
            <ul className="text-sm flex flex-col gap-2 text-[var(--color-ink-soft)]">
              <li>« Rayure de 5 cm sur l&apos;accoudoir gauche, invisible de face. »</li>
              <li>« Vous économisez 460 000 FCFA grâce au défaut. »</li>
              <li>« Coloris arrêté par le fabricant. »</li>
            </ul>
          </div>
          <div className="surface p-5">
            <p className="label flex items-center gap-1.5 !text-[var(--color-danger)]">
              <Icon name="close" size={13} /> On n&apos;écrit pas
            </p>
            <ul className="text-sm flex flex-col gap-2 text-[var(--color-ink-soft)]">
              <li>« Petit défaut sans importance » (trop vague).</li>
              <li>« Comme neuf !!! » (promesse invérifiable).</li>
              <li>« Prix sacrifié, dépêchez-vous » (pression commerciale).</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <div className="mb-5">
        <h2 className="font-display text-[26px] font-bold">{title}</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Rule({
  icon,
  title,
  children,
  danger,
}: {
  icon: "check-circle" | "alert";
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="surface p-4 flex gap-3">
      <Icon
        name={icon}
        size={18}
        className={`mt-0.5 shrink-0 ${danger ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}
      />
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-[var(--color-ink-muted)] mt-0.5 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
