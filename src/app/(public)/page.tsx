import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd, organizationLd, websiteLd } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cardSelect, PUBLISHED, favoriteIds } from "@/lib/queries";
import { VERTICAL_LIST, GRADE_LIST, BRAND } from "@/lib/constants";
import { money, moneyCompact } from "@/lib/format";
import ProductCard, { ProductGrid } from "@/components/ProductCard";
import Logo from "@/components/Logo";
import Icon, { type IconName } from "@/components/Icon";
import { SectionTitle, GradeBadge, Badge } from "@/components/ui";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const user = await getCurrentUser();

  const [featured, flash, latest, counts, cheapest] = await Promise.all([
    prisma.product.findMany({
      where: { ...PUBLISHED, isFeatured: true },
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    prisma.product.findMany({
      where: { ...PUBLISHED, isFlashDeal: true },
      select: cardSelect,
      orderBy: { discountPct: "desc" },
      take: 4,
    }),
    prisma.product.findMany({
      where: PUBLISHED,
      select: cardSelect,
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
    prisma.product.groupBy({ by: ["vertical"], where: PUBLISHED, _count: true }),
    prisma.product.aggregate({ where: PUBLISHED, _min: { price: true }, _avg: { discountPct: true } }),
  ]);

  const favs = await favoriteIds(user?.id);
  const countBy = Object.fromEntries(counts.map((c) => [c.vertical, c._count])) as Record<string, number>;
  const total = counts.reduce((s, c) => s + c._count, 0);
  const avgDiscount = Math.round(cheapest._avg.discountPct ?? 0);

  const showcase = featured.length >= 4 ? featured : latest;

  return (
    <>
      <JsonLd data={[organizationLd(), websiteLd()]} />
      {/* ---------------------------- HÉROS ---------------------------- */}
      <section className="relative overflow-hidden bg-[var(--color-cream)]">
        <div className="mx-auto max-w-[1280px] px-4 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 items-center py-14 lg:py-20">
          <div className="animate-fade-up">
            <Logo size={76} variant="mark" />

            <h1 className="font-display text-[42px] sm:text-[56px] lg:text-[64px] font-bold leading-[0.95] mt-6 uppercase tracking-tight">
              Le Beau
              <br />
              <span className="text-gilded">Défaut</span>
            </h1>

            <div className="rule-gold my-5 max-w-sm" />

            <p className="font-script text-gilded text-[30px] sm:text-[38px] leading-[1.15] max-w-md">
              {BRAND.tagline}
            </p>

            <p className="text-[15px] text-[var(--color-ink-soft)] mt-6 max-w-lg leading-relaxed">
              Les entreprises de mobilier du Congo ont du stock invendable pour un rien : une rayure, une
              fin de série, un carton abîmé. Nous le reprenons, nous photographions le défaut, nous le
              décrivons — et le prix en tient compte.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link href="/catalogue" className="btn btn-primary btn-lg">
                <Icon name="search" size={17} /> Voir les articles
              </Link>
              <Link href="/le-defaut" className="btn btn-outline btn-lg">
                Comment on note le défaut
              </Link>
            </div>

          </div>

          {/* Arc doré — signature du visuel de marque */}
          <div className="relative hidden lg:block">
            <div
              className="relative aspect-[4/5] overflow-hidden"
              style={{
                borderRadius: "50% 0 0 50% / 50% 0 0 50%",
                border: "3px solid transparent",
                backgroundImage:
                  "linear-gradient(var(--color-cream-deep), var(--color-cream-deep)), linear-gradient(160deg, #F0DCA0, #C9A227 40%, #8C6A24)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
              }}
            >
              {showcase[0]?.images[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={showcase[0].images[0].url}
                  alt={showcase[0].title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="h-full w-full grid place-items-center text-[var(--color-gold)]">
                  <Icon name="armchair" size={80} strokeWidth={0.9} />
                </span>
              )}
            </div>

            {showcase[0] && (
              <Link
                href={`/produit/${showcase[0].slug}`}
                className="surface absolute bottom-6 -left-6 p-4 w-64 shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge tone="warning">Coup de cœur</Badge>
                  <GradeBadge grade={showcase[0].defectGrade} size="sm" />
                </div>
                <p className="font-display font-semibold text-sm line-clamp-2 leading-snug">
                  {showcase[0].title}
                </p>
                <p className="text-[11px] text-[var(--color-ink-muted)] mt-1 line-clamp-1">
                  {showcase[0].defectSummary}
                </p>
                <p className="font-display font-bold mt-2">
                  {money(showcase[0].price)}{" "}
                  <span className="text-[11px] font-sans font-normal text-[var(--color-ink-muted)] line-through">
                    {money(showcase[0].priceOriginal, false)}
                  </span>
                </p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------- NOTRE UNIVERS ---------------------------- */}
      <section className="mx-auto max-w-[1280px] px-4 py-14">
        <SectionTitle
          eyebrow="Le catalogue"
          title="Un seul univers, des prix qui parlent"
          subtitle="Du mobilier neuf, invendu ou légèrement abîmé, contrôlé par nos soins : le défaut est décrit sans détour, le prix en tient compte."
        />
        <div className="grid grid-cols-1 gap-5">
          <Link href="/catalogue" className="surface surface-hover p-7 group relative overflow-hidden">
            <span className="absolute -right-6 -top-6 text-[var(--color-gold)] opacity-[0.07] group-hover:opacity-[0.13] transition-opacity">
              <Icon name="armchair" size={140} strokeWidth={0.7} />
            </span>
            <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-pale)] text-[var(--color-gold-dark)] mb-4">
              <Icon name="armchair" size={23} />
            </span>
            <h3 className="relative font-display text-xl font-bold">Mobilier à petit défaut</h3>
            <p className="relative text-sm text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">Canapés, tables, dressers et rangements : le défaut est visible en photo, la remise découle du grade.</p>
            <p className="relative inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-gold-dark)] mt-4">
              {total} article{total > 1 ? "s" : ""}
              <Icon name="arrow-right" size={14} className="group-hover:translate-x-1 transition-transform" />
            </p>
          </Link>
        </div>
      </section>

      {/* ---------------------------- LA GRILLE DU DÉFAUT ---------------------------- */}
      <section className="bg-[var(--color-linen)] border-y border-[var(--color-sand)] py-14">
        <div className="mx-auto max-w-[1280px] px-4">
          <SectionTitle
            eyebrow="Notre règle du jeu"
            title="La grille du défaut"
            subtitle="Chaque article est noté A, B ou C. La note détermine la remise minimale. Aucun défaut n'est caché : il est photographié, situé et décrit."
            action={
              <Link href="/le-defaut" className="btn btn-outline btn-sm">
                Tout comprendre <Icon name="arrow-right" size={14} />
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {GRADE_LIST.map((g) => (
              <Link
                key={g.key}
                href={`/catalogue?grade=${g.key}`}
                className="surface surface-hover p-6 border-t-[3px]"
                style={{ borderTopColor: g.color }}
              >
                <div className="flex items-center justify-between mb-3">
                  <GradeBadge grade={g.key} size="lg" />
                  <span className="chip font-bold" style={{ background: g.bg, color: g.color }}>
                    −{g.minDiscount} à {g.maxDiscount} %
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold">{g.name}</h3>
                <p className="text-sm text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">{g.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- BONNES AFFAIRES ---------------------------- */}
      {flash.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 py-14">
          <SectionTitle
            eyebrow="Prix cassés"
            title="Les bonnes affaires du moment"
            subtitle="Sélectionnées à la main : le défaut est réel, la remise aussi."
            action={
              <Link href="/catalogue?tri=remise" className="btn btn-ghost btn-sm">
                Voir tout <Icon name="arrow-right" size={14} />
              </Link>
            }
          />
          <ProductGrid>
            {flash.map((p) => (
              <ProductCard key={p.id} product={p} isFavorite={favs.has(p.id)} revalidate="/" />
            ))}
          </ProductGrid>
        </section>
      )}

      {/* ---------------------------- SÉLECTION ---------------------------- */}
      {showcase.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 pb-14">
          <SectionTitle
            eyebrow="Sélection de la maison"
            title="Nos coups de cœur"
            action={
              <Link href="/catalogue" className="btn btn-ghost btn-sm">
                Tout le catalogue <Icon name="arrow-right" size={14} />
              </Link>
            }
          />
          <ProductGrid>
            {showcase.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} isFavorite={favs.has(p.id)} revalidate="/" />
            ))}
          </ProductGrid>
        </section>
      )}


      {/* ---------------------------- COMMENT ÇA MARCHE ---------------------------- */}
      <section className="mx-auto max-w-[1280px] px-4 py-16">
        <SectionTitle eyebrow="En quatre temps" title="Comment ça se passe" />
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[
            { icon: "search", t: "Vous chinez", d: "Filtrez par univers, par grade de défaut, par budget et par quartier." },
            { icon: "eye", t: "Vous inspectez", d: "Photos du défaut, zone touchée, sévérité notée de 1 à 5. Rien n'est flouté." },
            { icon: "cart", t: "Vous commandez", d: "Paiement par Mobile Money, confirmé par notre équipe. Le prix affiché est le prix payé." },
            { icon: "truck", t: "On livre", d: "Livraison dans tout Brazzaville, ou retrait en dépôt." },
          ].map((s, i) => (
            <li key={s.t} className="surface p-6 relative">
              <span className="absolute top-4 right-5 font-display text-[44px] font-bold text-[var(--color-sand)] leading-none select-none">
                {i + 1}
              </span>
              <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-gold-pale)] text-[var(--color-gold-dark)] mb-3.5">
                <Icon name={s.icon as IconName} size={20} />
              </span>
              <h3 className="relative font-display font-bold text-base">{s.t}</h3>
              <p className="relative text-sm text-[var(--color-ink-muted)] mt-1.5 leading-relaxed">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------- NOTRE PROMESSE ---------------------------- */}
      <section className="mx-auto max-w-[1280px] px-4 pb-6">
        <div className="surface overflow-hidden grid grid-cols-1 md:grid-cols-[1.3fr_1fr]">
          <div className="p-9 md:p-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-dark)] mb-2">
              Une seule boutique : la nôtre
            </p>
            <h2 className="font-display text-[30px] font-bold leading-tight">
              Nous choisissons chaque pièce.
              <br />
              Vous achetez en confiance.
            </h2>
            <p className="text-[15px] text-[var(--color-ink-soft)] mt-4 leading-relaxed max-w-lg">
              Tout ce que vous voyez sur le site appartient à Le Beau Défaut. Nous sélectionnons, inspectons et
              photographions chaque article, défaut compris, puis nous le livrons nous-mêmes. Pas d&apos;intermédiaire,
              pas de vendeur inconnu : vous traitez directement avec nous.
            </p>
            <ul className="flex flex-col gap-2 mt-6">
              {[
                "Chaque défaut est montré en photo et noté A, B ou C",
                "Paiement simple par Mobile Money, confirmé par notre équipe",
                "Vous suivez votre commande jusqu'à la livraison",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2.5 text-sm text-[var(--color-ink-soft)]">
                  <Icon name="check-circle" size={16} className="mt-0.5 text-[var(--color-success)] shrink-0" />
                  {li}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="/catalogue" className="btn btn-gold btn-lg">
                Découvrir le catalogue
              </Link>
              <Link href="/le-defaut" className="btn btn-outline btn-lg">
                Comment on note les défauts
              </Link>
            </div>
          </div>
          <div className="bg-[var(--color-cream-deep)] hidden md:grid place-items-center p-10 border-l border-[var(--color-sand)]">
            <div className="text-center">
              <Logo size={100} variant="mark" />
              <div className="rule-gold my-5" />
              <p className="font-script text-gilded text-2xl leading-tight">
                Les petits défauts
                <br />
                font de grandes économies
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--color-ink-muted)]">
        {label}
      </dt>
      <dd className="font-display text-[26px] font-bold leading-none mt-1">{value}</dd>
    </div>
  );
}
