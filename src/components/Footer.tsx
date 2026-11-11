import Link from "next/link";
import Logo from "./Logo";
import Icon from "./Icon";
import { VERTICAL_LIST, GRADE_LIST, BRAND } from "@/lib/constants";

const PILLAR_ICONS = ["armchair", "lamp", "medal", "tag"] as const;

export default function Footer() {
  return (
    <footer className="mt-20 no-print">
      {/* Les 4 piliers du logo */}
      <div className="border-y border-[var(--color-sand)] bg-[var(--color-linen)]">
        <div className="mx-auto max-w-[1280px] px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {BRAND.pillars.map((p, i) => (
            <div key={p} className="flex flex-col items-center text-center gap-2">
              <span className="text-[var(--color-gold)]">
                <Icon name={PILLAR_ICONS[i]} size={26} strokeWidth={1.3} />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-soft)]">
                {p}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-ink)] text-[var(--color-cream)]">
        <div className="mx-auto max-w-[1280px] px-4 py-12">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Logo size={42} variant="full" onDark />
              <p className="font-script text-gilded text-xl mt-3">{BRAND.tagline}</p>
              <p className="text-sm text-[var(--color-cream)]/65 mt-4 max-w-xs leading-relaxed">
                La boutique congolaise qui assume le défaut : chaque article est photographié sous son
                mauvais angle, décrit sans détour, et vendu au juste prix.
              </p>
              <div className="flex items-center gap-3 mt-5 text-[var(--color-cream)]/60">
                <a href="tel:+242000000000" className="hover:text-[var(--color-gold-light)] transition-colors" aria-label="Téléphone">
                  <Icon name="phone" size={17} />
                </a>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="inline-flex items-center gap-1.5 text-xs hover:text-[var(--color-gold-light)] transition-colors"
                >
                  <Icon name="mail" size={15} /> {BRAND.email}
                </a>
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <Icon name="pin" size={15} /> Brazzaville
                </span>
              </div>
            </div>

            <FooterCol title="Boutique">
              {VERTICAL_LIST.map((v) => (
                <FooterLink key={v.key} href={`/${v.slug}`}>
                  {v.label}
                </FooterLink>
              ))}
              <FooterLink href="/catalogue">Tout le catalogue</FooterLink>
              <FooterLink href="/catalogue?tri=remise">Meilleures remises</FooterLink>
            </FooterCol>

            <FooterCol title="La grille du défaut">
              {GRADE_LIST.map((g) => (
                <FooterLink key={g.key} href={`/le-defaut#grade-${g.key.toLowerCase()}`}>
                  {g.label} — {g.name}
                </FooterLink>
              ))}
              <FooterLink href="/le-defaut">Comment on note</FooterLink>
            </FooterCol>

            <FooterCol title="Le Beau Défaut">
              <FooterLink href="/a-propos">Notre histoire</FooterLink>
              <FooterLink href="/inscription">Créer un compte</FooterLink>
              <FooterLink href="/aide">Aide & livraison</FooterLink>
              <FooterLink href="/identite">Identité visuelle</FooterLink>
            </FooterCol>

            <FooterCol title="Informations">
              <FooterLink href="/conditions">Conditions de vente</FooterLink>
              <FooterLink href="/confidentialite">Confidentialité & cookies</FooterLink>
              <FooterLink href="/mentions-legales">Mentions légales</FooterLink>
            </FooterCol>
          </div>

          <div className="rule-gold my-8 opacity-40" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--color-cream)]/50">
            <p>
              © {new Date().getFullYear()} {BRAND.name} — République du Congo. Tous droits réservés.
            </p>
            <p className="flex items-center gap-1.5">
              <Icon name="shield" size={13} /> Paiement Mobile Money · MTN &amp; Airtel
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-gold-light)] mb-3.5">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-[var(--color-cream)]/65 hover:text-[var(--color-gold-light)] transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
