import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { money, dateTimeFR, relativeFR } from "@/lib/format";
import { PRODUCT_STATUS, AUTHENTICITY, gradeOf, GRADE_LIST } from "@/lib/constants";
import {
  approveProductAction,
  rejectProductAction,
  setAuthenticityAction,
  toggleProductFlagAction,
} from "@/lib/actions/admin";
import DefectReport from "@/components/DefectReport";
import Icon from "@/components/Icon";
import { Badge, GradeBadge, Alert, Card } from "@/components/ui";

const REJECTION_TEMPLATES = [
  "La remise ne respecte pas la grille pour ce grade.",
  "Aucune photo ne montre clairement le défaut.",
  "Le défaut déclaré semble plus important que le grade choisi.",
  "Description trop vague : précisez la zone et la taille du défaut.",
  "Doute sur l'authenticité : merci de fournir facture ou certificat.",
];

export default async function AdminProductReview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      defects: true,
      category: true,
      moderator: { select: { firstName: true, lastName: true } },
      seller: { include: { seller: true } },
      _count: { select: { orderItems: true, favorites: true, reviews: true } },
    },
  });
  if (!product) notFound();

  const g = gradeOf(product.defectGrade);
  const discountOk = product.discountPct >= g.minDiscount;
  const defectPhotos = product.images.filter((i) => i.isDefect).length;
  const suggestedGrade =
    [...GRADE_LIST].reverse().find((gr) => product.discountPct >= gr.minDiscount)?.key ?? "A";

  const checks = [
    { ok: discountOk, label: `Remise de ${product.discountPct} % pour un ${g.label} (minimum ${g.minDiscount} %)` },
    { ok: product.defects.length > 0, label: `${product.defects.length} défaut(s) détaillé(s)` },
    { ok: defectPhotos > 0, label: `${defectPhotos} photo(s) du défaut` },
    { ok: product.images.length >= 2, label: `${product.images.length} photo(s) au total` },
    { ok: product.description.length >= 80, label: `Description de ${product.description.length} caractères` },
  ];

  return (
    <>
      <Link href="/admin/annonces" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Retour aux annonces
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <p className="font-mono text-xs text-[var(--color-ink-muted)]">{product.reference}</p>
          <h1 className="font-display text-[26px] font-bold leading-tight">{product.title}</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            {product.category.name} · déposée {relativeFR(product.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={PRODUCT_STATUS[product.status].tone} className="!text-xs !px-3 !py-1">
            {PRODUCT_STATUS[product.status].label}
          </Badge>
          <Link href={`/produit/${product.slug}`} target="_blank" className="btn btn-outline btn-sm">
            <Icon name="eye" size={14} /> Voir la fiche
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          {/* Photos */}
          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {product.images.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="relative block group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt ?? ""} className="aspect-square w-full rounded-xl object-cover" />
                  {img.isCover && <span className="absolute top-2 left-2 chip bg-[var(--color-ink)] text-[var(--color-cream)]">Principale</span>}
                  {img.isDefect && <span className="absolute top-2 left-2 chip bg-[var(--color-danger)] text-white">Défaut</span>}
                </a>
              ))}
            </div>
          </Card>

          <DefectReport
            grade={product.defectGrade}
            summary={product.defectSummary}
            defects={product.defects}
            discountPct={product.discountPct}
          />

          <Card>
            <h2 className="font-display text-lg font-bold mb-2">Description</h2>
            <p className="text-sm text-[var(--color-ink-soft)] whitespace-pre-line leading-relaxed">{product.description}</p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-5 pt-4 border-t border-[var(--color-sand)] text-sm">
              {[
                ["Marque", product.brand],
                ["Matière", product.material],
                ["Couleur", product.color],
                ["Dimensions", product.dimensions],
                ["Poids", product.weightKg ? `${product.weightKg} kg` : null],
                ["Quantité", String(product.quantity)],
                ["Ville", `${product.quartier ? product.quartier + ", " : ""}${product.city}`],
                ["Retrait uniquement", product.pickupOnly ? "Oui" : "Non"],
                ["N° de série", product.serialNumber],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-[var(--color-ink-muted)]">{k}</dt>
                    <dd className="font-medium text-right">{v}</dd>
                  </div>
                ))}
            </dl>
          </Card>
        </div>

        {/* Panneau de décision */}
        <div className="flex flex-col gap-5 xl:sticky xl:top-6">
          <Card>
            <h2 className="font-display text-lg font-bold mb-3">Contrôle de conformité</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-2">
                  <Icon
                    name={c.ok ? "check-circle" : "alert"}
                    size={16}
                    className={`mt-0.5 shrink-0 ${c.ok ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}
                  />
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>

            <div className="rule-gold my-4" />

            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-ink-muted)]">Prix neuf → LBD</span>
              <span className="font-semibold">
                {money(product.priceOriginal, false)} → {money(product.price)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-[var(--color-ink-muted)]">Grade déclaré</span>
              <GradeBadge grade={product.defectGrade} withName />
            </div>
            {!discountOk && (
              <div className="mt-3">
                <Alert tone="warning">
                  Avec {product.discountPct} % de remise, le grade cohérent serait au plus{" "}
                  <strong>{gradeOf(suggestedGrade).label}</strong>.
                </Alert>
              </div>
            )}
          </Card>

          {product.status !== "PUBLIE" && product.status !== "VENDU" && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-3">Décision</h2>
              <form action={approveProductAction} className="flex flex-col gap-3">
                <input type="hidden" name="productId" value={product.id} />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="featured" className="accent-[var(--color-gold)]" />
                  Mettre en « coup de cœur » sur l&apos;accueil
                </label>
                <button className="btn w-full !bg-[var(--color-grade-a)] !text-white" disabled={!discountOk}>
                  <Icon name="check" size={15} /> Publier l&apos;annonce
                </button>
              </form>

              <form action={rejectProductAction} className="flex flex-col gap-2 mt-5 pt-5 border-t border-[var(--color-sand)]">
                <input type="hidden" name="productId" value={product.id} />
                <label className="label" htmlFor="reason">
                  Motif (note interne)
                </label>
                <select
                  className="field"
                  defaultValue=""
                  aria-label="Motifs fréquents"
                  name="template"
                >
                  <option value="" disabled>
                    Motifs fréquents…
                  </option>
                  {REJECTION_TEMPLATES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <textarea
                  id="reason"
                  name="reason"
                  rows={3}
                  className="field"
                  defaultValue={!discountOk ? REJECTION_TEMPLATES[0] : ""}
                  placeholder="Expliquez précisément ce qu'il faut corriger."
                />
                <button className="btn btn-outline w-full !text-[var(--color-danger)] !border-[var(--color-danger)]/40">
                  <Icon name="close" size={14} /> Remettre en brouillon
                </button>
              </form>
            </Card>
          )}

          {product.status === "PUBLIE" && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-3">Mise en avant</h2>
              <div className="flex flex-col gap-2">
                <form action={toggleProductFlagAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="flag" value="isFeatured" />
                  <button className={`btn w-full ${product.isFeatured ? "btn-gold" : "btn-outline"}`}>
                    <Icon name="star" size={14} /> {product.isFeatured ? "Retirer des coups de cœur" : "Coup de cœur"}
                  </button>
                </form>
                <form action={toggleProductFlagAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="flag" value="isFlashDeal" />
                  <button className={`btn w-full ${product.isFlashDeal ? "btn-danger" : "btn-outline"}`}>
                    <Icon name="sparkle" size={14} /> {product.isFlashDeal ? "Retirer des bonnes affaires" : "Bonne affaire"}
                  </button>
                </form>
              </div>
              <form action={rejectProductAction} className="mt-4 pt-4 border-t border-[var(--color-sand)] flex flex-col gap-2">
                <input type="hidden" name="productId" value={product.id} />
                <input name="reason" className="field" placeholder="Motif de dépublication" required />
                <button className="btn btn-ghost btn-sm !text-[var(--color-danger)]">Dépublier l&apos;annonce</button>
              </form>
            </Card>
          )}

          {product.vertical === "SACS" && (
            <Card>
              <h2 className="font-display text-lg font-bold mb-1">Authentification</h2>
              <p className="text-xs text-[var(--color-ink-muted)] mb-3">
                Contrôle des coutures, ferrures, numéro de série, dust bag et facture.
              </p>
              <p className="text-sm mb-3">
                Statut actuel : <Badge tone={AUTHENTICITY[product.authenticity].tone}>{AUTHENTICITY[product.authenticity].label}</Badge>
              </p>
              <ul className="text-xs text-[var(--color-ink-muted)] mb-3 flex flex-col gap-1">
                <li>N° de série : {product.serialNumber ?? "non renseigné"}</li>
                <li>Dust bag : {product.hasDustBag ? "oui" : "non"} · Facture/certificat : {product.hasCertif ? "oui" : "non"}</li>
              </ul>
              <form action={setAuthenticityAction} className="flex gap-2">
                <input type="hidden" name="productId" value={product.id} />
                <select name="authenticity" defaultValue={product.authenticity} className="field">
                  {["NON_VERIFIE", "EN_COURS", "AUTHENTIFIE_LBD", "REFUSE"].map((a) => (
                    <option key={a} value={a}>
                      {AUTHENTICITY[a].label}
                    </option>
                  ))}
                </select>
                <button className="btn btn-primary btn-sm">OK</button>
              </form>
            </Card>
          )}

          <Card>
            <h2 className="font-display text-base font-bold mb-2">Historique</h2>
            <ul className="text-xs text-[var(--color-ink-muted)] flex flex-col gap-1.5">
              <li>Créée le {dateTimeFR(product.createdAt)}</li>
              {product.moderatedAt && (
                <li>
                  Modérée le {dateTimeFR(product.moderatedAt)}
                  {product.moderator && ` par ${product.moderator.firstName} ${product.moderator.lastName}`}
                </li>
              )}
              {product.rejectionReason && <li className="text-[var(--color-danger)]">Motif : {product.rejectionReason}</li>}
              <li>
                {product.views} vues · {product._count.favorites} favoris · {product._count.orderItems} vente(s)
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
