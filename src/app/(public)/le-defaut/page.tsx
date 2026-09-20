import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { GRADE_LIST, DEFECT_TYPES, SEVERITY_LABELS } from "@/lib/constants";
import { money } from "@/lib/format";
import Icon from "@/components/Icon";
import { GradeBadge, Breadcrumb } from "@/components/ui";

export const metadata: Metadata = {
  title: "La grille du défaut",
  description: "Comment Le Beau Défaut note chaque article : grades A, B, C, sévérité, photos et remise minimale.",
};

export default async function DefectGuidePage() {
  const [examples, conform, reviews] = await Promise.all([
    Promise.all(
      GRADE_LIST.map((g) =>
        prisma.product.findFirst({
          where: { status: "PUBLIE", defectGrade: g.key },
          orderBy: { views: "desc" },
          select: { slug: true, title: true, defectSummary: true, price: true, priceOriginal: true, discountPct: true, images: { where: { isCover: true }, take: 1 } },
        })
      )
    ),
    prisma.review.count({ where: { defectAsDescribed: true } }),
    prisma.review.count(),
  ]);
  const conformity = reviews ? Math.round((conform / reviews) * 100) : 100;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "La grille du défaut" }]} />

      <header className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-deep)] mb-2">Notre règle du jeu</p>
        <h1 className="font-display text-[40px] sm:text-[48px] font-bold leading-tight">La grille du défaut</h1>
        <div className="rule-gold my-5 max-w-xs mx-auto" />
        <p className="text-[16px] text-[var(--color-ink-soft)] leading-relaxed">
          Acheter un article à petit défaut, c&apos;est accepter une imperfection en échange d&apos;un vrai prix. Encore faut-il
          savoir exactement laquelle. Chaque annonce passe par la même grille, vérifiée par notre équipe avant publication.
        </p>
        <p className="mt-5 inline-flex items-center justify-center gap-2 chip bg-[var(--color-grade-a-bg)] text-[var(--color-grade-a)] !text-sm !px-4 !py-1.5 !whitespace-normal text-center max-w-full">
          <Icon name="shield" size={15} /> {conformity} % des acheteurs confirment : le défaut était conforme à l&apos;annonce
        </p>
      </header>

      {/* Les trois grades */}
      <section className="flex flex-col gap-6 mb-16">
        {GRADE_LIST.map((g, i) => {
          const ex = examples[i];
          return (
            <article
              key={g.key}
              id={`grade-${g.key.toLowerCase()}`}
              className="surface overflow-hidden grid grid-cols-1 md:grid-cols-[1.3fr_1fr] scroll-mt-40"
              style={{ borderTop: `4px solid ${g.color}` }}
            >
              <div className="p-7">
                <div className="flex items-center gap-4 mb-4">
                  <GradeBadge grade={g.key} size="lg" />
                  <div>
                    <h2 className="font-display text-2xl font-bold">{g.label} · {g.name}</h2>
                    <p className="text-sm font-semibold" style={{ color: g.color }}>
                      Remise de {g.minDiscount} à {g.maxDiscount} % sur le prix neuf
                    </p>
                  </div>
                </div>
                <p className="text-[15px] text-[var(--color-ink-soft)] leading-relaxed">{g.description}</p>
                <p className="label mt-5">Exemples typiques</p>
                <ul className="text-sm text-[var(--color-ink-soft)] flex flex-col gap-1.5">
                  {(g.key === "A"
                    ? ["Carton abîmé, article intact", "Coloris ou modèle en fin de série", "Micro-rayure sous une assise", "Retour client jamais utilisé"]
                    : g.key === "B"
                      ? ["Tache légère sur un coussin déhoussable", "Décoloration d'un côté exposé en vitrine", "Petite bosse sur un pied, invisible de face", "Coins de sac légèrement frottés"]
                      : ["Accroc dans le tissu, réparable", "Pièce manquante (tablette, bandoulière)", "Usure franche d'un modèle d'exposition", "Éclat visible sur un plateau"]
                  ).map((e) => (
                    <li key={e} className="flex gap-2">
                      <span className="mt-1 shrink-0" style={{ color: g.color }}>
                        <Icon name="check" size={14} />
                      </span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>

              {ex ? (
                <Link href={`/produit/${ex.slug}`} className="relative block bg-[var(--color-cream-deep)] group min-h-[240px]">
                  {ex.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ex.images[0].url} alt={ex.title} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-x-3 bottom-3 surface p-3.5 group-hover:-translate-y-1 transition-transform">
                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-ink-muted)]">Exemple en ligne</p>
                    <p className="font-display font-semibold text-sm line-clamp-1">{ex.title}</p>
                    <p className="text-xs text-[var(--color-ink-muted)] line-clamp-1">{ex.defectSummary}</p>
                    <p className="text-sm font-semibold mt-1">
                      {money(ex.price)}{" "}
                      <span className="text-[11px] font-normal text-[var(--color-ink-muted)] line-through">{money(ex.priceOriginal, false)}</span>{" "}
                      <span className="text-[11px]">−{ex.discountPct} %</span>
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="bg-[var(--color-cream-deep)] grid place-items-center min-h-[200px]">
                  <GradeBadge grade={g.key} size="lg" />
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Comment on décrit */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="surface p-7">
          <h2 className="font-display text-2xl font-bold mb-2">Chaque défaut est décrit en 4 points</h2>
          <ol className="flex flex-col gap-4 mt-5">
            {[
              ["Le type", "Rayure, tache, accroc, décoloration, pièce manquante, fin de série…"],
              ["La zone", "« Accoudoir gauche », « pied arrière », « doublure intérieure ». Jamais « un peu partout »."],
              ["La sévérité", "De 1 (à peine visible) à 5 (marqué), sur une échelle identique pour tous les vendeurs."],
              ["La photo", "Au moins un gros plan du défaut, obligatoire pour publier."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3.5">
                <span className="h-8 w-8 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] grid place-items-center text-sm font-semibold shrink-0">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-[var(--color-ink-muted)]">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="surface p-7">
          <h2 className="font-display text-2xl font-bold mb-2">L&apos;échelle de sévérité</h2>
          <ul className="flex flex-col gap-3 mt-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <li key={n} className="flex items-center gap-4">
                <span className="flex gap-1" aria-hidden>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <span key={k} className="h-2 w-7 rounded-full" style={{ background: k <= n ? "var(--color-gold)" : "var(--color-sand)" }} />
                  ))}
                </span>
                <span className="text-sm">
                  <strong>{n}</strong> · {SEVERITY_LABELS[n]}
                </span>
              </li>
            ))}
          </ul>
          <p className="label mt-7">Les types de défaut</p>
          <div className="flex flex-wrap gap-1.5">
            {DEFECT_TYPES.map((t) => (
              <span key={t.key} className="chip bg-[var(--color-cream-deep)] text-[var(--color-ink-soft)]">
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Garantie */}
      <section className="rounded-[18px] bg-[var(--color-ink)] text-[var(--color-cream)] p-8 sm:p-12 text-center">
        <Icon name="shield" size={34} className="mx-auto text-[var(--color-gold-light)]" />
        <h2 className="font-display text-[30px] font-bold mt-3">La garantie « défaut conforme »</h2>
        <p className="text-[var(--color-cream)]/75 max-w-xl mx-auto mt-3 leading-relaxed">
          Si l&apos;article reçu présente un défaut qui n&apos;était pas annoncé, signalez-le sous 3 jours : nous le
          reprenons et vous remboursons. Le vendeur, lui, voit sa note baisser. C&apos;est ce qui rend la grille fiable.
        </p>
        <p className="font-script text-gilded text-3xl mt-6">Les petits défauts font de grandes économies</p>
        <Link href="/catalogue" className="btn btn-gold btn-lg mt-7">
          Voir les articles
        </Link>
      </section>
    </div>
  );
}
