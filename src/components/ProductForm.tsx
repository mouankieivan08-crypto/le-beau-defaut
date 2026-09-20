"use client";

import { useMemo, useState } from "react";
import { useStickyAction } from "@/lib/use-sticky-action";
import { createProductAction, updateProductAction } from "@/lib/actions/seller";
import { VERTICAL_LIST, GRADE_LIST, CITIES, QUARTIERS, defectTypesFor, SEVERITY_LABELS, gradeOf } from "@/lib/constants";
import { money } from "@/lib/format";
import Icon from "./Icon";
import { Alert, GradeBadge } from "./ui";

type Category = { id: string; name: string; vertical: string };
type DefectInput = { type: string; zone: string; severity: number; description: string; repairable: boolean; repairNote: string };

export type ProductInitial = {
  id: string;
  title: string;
  description: string;
  vertical: string;
  categoryId: string;
  priceOriginal: number;
  price: number;
  defectGrade: string;
  defectSummary: string;
  quantity: number;
  city: string;
  quartier: string | null;
  brand: string | null;
  material: string | null;
  color: string | null;
  dimensions: string | null;
  weightKg: number | null;
  negotiable: boolean;
  pickupOnly: boolean;
  serialNumber: string | null;
  hasDustBag: boolean;
  hasCertif: boolean;
  defects: DefectInput[];
};

const EMPTY_DEFECT: DefectInput = { type: "", zone: "", severity: 1, description: "", repairable: false, repairNote: "" };

export default function ProductForm({
  categories,
  initial,
  defaultCity = "Brazzaville",
}: {
  categories: Category[];
  initial?: ProductInitial;
  defaultCity?: string;
}) {
  const isEdit = !!initial;
  const [state, onSubmit, pending] = useStickyAction(isEdit ? updateProductAction : createProductAction, undefined);

  const [vertical, setVertical] = useState(initial?.vertical ?? "MOBILIER");
  const [grade, setGrade] = useState(initial?.defectGrade ?? "A");
  const [orig, setOrig] = useState<number>(initial?.priceOriginal ?? 0);
  const [price, setPrice] = useState<number>(initial?.price ?? 0);
  const [city, setCity] = useState(initial?.city ?? defaultCity);
  const [defects, setDefects] = useState<DefectInput[]>(initial?.defects.length ? initial.defects : [{ ...EMPTY_DEFECT }]);
  const [summary, setSummary] = useState(initial?.defectSummary ?? "");

  const cats = categories.filter((c) => c.vertical === vertical);
  const g = gradeOf(grade);
  const pct = orig > 0 && price > 0 && price < orig ? Math.round(((orig - price) / orig) * 100) : 0;
  const compliant = pct >= g.minDiscount;
  const suggested = useMemo(() => {
    if (!orig) return null;
    return {
      max: Math.floor((orig * (1 - g.minDiscount / 100)) / 500) * 500,
      min: Math.ceil((orig * (1 - g.maxDiscount / 100)) / 500) * 500,
    };
  }, [orig, g]);
  const types = defectTypesFor(vertical);

  const updateDefect = (i: number, patch: Partial<DefectInput>) =>
    setDefects((d) => d.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {initial && <input type="hidden" name="productId" value={initial.id} />}

      {state?.error && (
        <div className="sticky top-16 lg:top-4 z-20">
          <Alert tone="danger" title="Impossible d'enregistrer">
            {state.error}
          </Alert>
        </div>
      )}
      {state?.success && <Alert tone="success">{state.success}</Alert>}

      {/* 1. Univers */}
      <Section n={1} title="Univers et catégorie">
        <input type="hidden" name="vertical" value={vertical} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {VERTICAL_LIST.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setVertical(v.key)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                vertical === v.key
                  ? "border-[var(--color-gold)] bg-[var(--color-gold-pale)]/35"
                  : "border-[var(--color-sand)] hover:border-[var(--color-gold-light)]"
              }`}
            >
              <Icon name={v.icon as "armchair" | "bag" | "box"} size={20} className="text-[var(--color-gold-deep)] mb-2" />
              <p className="font-semibold text-sm">{v.label}</p>
              <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug">{v.tagline}</p>
            </button>
          ))}
        </div>
        <Field label="Catégorie" htmlFor="categoryId">
          <select
            id="categoryId"
            name="categoryId"
            className="field"
            defaultValue={initial?.categoryId ?? ""}
            key={vertical}
            required
          >
            <option value="" disabled>
              Choisir…
            </option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* 2. Description */}
      <Section n={2} title="L'article">
        <div className="grid gap-4">
          <Field label="Titre" htmlFor="title" hint="Ce que c'est + matière + couleur. Ex. « Canapé 3 places cuir cognac »">
            <input id="title" name="title" defaultValue={initial?.title} className="field" maxLength={120} required />
          </Field>
          <Field label="Description" htmlFor="description" hint="État général, usage, dimensions utiles, ce qui est inclus.">
            <textarea id="description" name="description" rows={5} defaultValue={initial?.description} className="field" required />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={vertical === "SACS" ? "Marque" : "Marque / fabricant"} htmlFor="brand">
              <input id="brand" name="brand" defaultValue={initial?.brand ?? ""} className="field" />
            </Field>
            <Field label="Matière" htmlFor="material">
              <input id="material" name="material" defaultValue={initial?.material ?? ""} className="field" />
            </Field>
            <Field label="Couleur" htmlFor="color">
              <input id="color" name="color" defaultValue={initial?.color ?? ""} className="field" />
            </Field>
            <Field label="Dimensions" htmlFor="dimensions">
              <input id="dimensions" name="dimensions" defaultValue={initial?.dimensions ?? ""} placeholder="L x P x H cm" className="field" />
            </Field>
            <Field label="Poids (kg)" htmlFor="weightKg">
              <input id="weightKg" name="weightKg" type="number" step="0.1" min="0" defaultValue={initial?.weightKg ?? ""} className="field" />
            </Field>
            <Field label="Quantité" htmlFor="quantity">
              <input id="quantity" name="quantity" type="number" min={1} max={999} defaultValue={initial?.quantity ?? 1} className="field" required />
            </Field>
          </div>

          {vertical === "SACS" && (
            <div className="rounded-xl bg-[var(--color-cream-deep)]/60 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Field label="N° de série / code date" htmlFor="serialNumber">
                <input id="serialNumber" name="serialNumber" defaultValue={initial?.serialNumber ?? ""} className="field" />
              </Field>
              <Check name="hasDustBag" label="Dust bag fourni" defaultChecked={initial?.hasDustBag} />
              <Check name="hasCertif" label="Facture ou certificat" defaultChecked={initial?.hasCertif} />
              <p className="sm:col-span-3 text-xs text-[var(--color-ink-muted)] flex gap-1.5">
                <Icon name="shield" size={13} className="shrink-0 mt-0.5" />
                Chaque sac passe par notre contrôle d&apos;authenticité avant d&apos;afficher le badge « Authentifié LBD ».
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* 3. Le défaut */}
      <Section n={3} title="Le défaut" subtitle="C'est la règle de la maison : on montre, on situe, on décrit. Un défaut caché, c'est un retour garanti.">
        <input type="hidden" name="defectGrade" value={grade} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {GRADE_LIST.map((gr) => (
            <button
              key={gr.key}
              type="button"
              onClick={() => setGrade(gr.key)}
              className="text-left p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: grade === gr.key ? gr.color : "var(--color-sand)",
                background: grade === gr.key ? gr.bg : "transparent",
              }}
              aria-pressed={grade === gr.key}
            >
              <div className="flex items-center justify-between mb-2">
                <GradeBadge grade={gr.key} />
                <span className="text-[11px] font-semibold" style={{ color: gr.color }}>
                  −{gr.minDiscount} à {gr.maxDiscount} %
                </span>
              </div>
              <p className="font-semibold text-sm">{gr.name}</p>
              <p className="text-[11px] text-[var(--color-ink-muted)] leading-snug mt-0.5">{gr.short}</p>
            </button>
          ))}
        </div>

        <Field label="Le défaut en une phrase" htmlFor="defectSummary" hint="Affiché sur la carte de l'article. Soyez précis : zone, taille, visibilité.">
          <input
            id="defectSummary"
            name="defectSummary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={200}
            placeholder="Ex. Rayure de 5 cm sur l'accoudoir gauche, invisible de face."
            className="field"
            required
          />
          <p className="text-[11px] text-[var(--color-ink-muted)] text-right mt-1">{summary.length}/200</p>
        </Field>

        <div className="flex flex-col gap-3 mt-2">
          {defects.map((d, i) => (
            <fieldset key={i} className="rounded-xl border border-[var(--color-sand)] p-4">
              <legend className="px-1.5 text-xs font-semibold text-[var(--color-ink-muted)]">Défaut n°{i + 1}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_160px] gap-3">
                <Field label="Type" htmlFor={`defect-${i}-type`}>
                  <select
                    id={`defect-${i}-type`}
                    name={`defect-${i}-type`}
                    value={d.type}
                    onChange={(e) => updateDefect(i, { type: e.target.value })}
                    className="field"
                    required={i === 0}
                  >
                    <option value="">Choisir…</option>
                    {types.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Zone" htmlFor={`defect-${i}-zone`}>
                  <input
                    id={`defect-${i}-zone`}
                    name={`defect-${i}-zone`}
                    value={d.zone}
                    onChange={(e) => updateDefect(i, { zone: e.target.value })}
                    placeholder="Ex. Pied arrière gauche"
                    className="field"
                  />
                </Field>
                <Field label={`Sévérité : ${SEVERITY_LABELS[d.severity]}`} htmlFor={`defect-${i}-severity`}>
                  <input
                    id={`defect-${i}-severity`}
                    name={`defect-${i}-severity`}
                    type="range"
                    min={1}
                    max={5}
                    value={d.severity}
                    onChange={(e) => updateDefect(i, { severity: Number(e.target.value) })}
                    className="w-full accent-[var(--color-gold)] mt-2.5"
                  />
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Description du défaut" htmlFor={`defect-${i}-description`}>
                  <textarea
                    id={`defect-${i}-description`}
                    name={`defect-${i}-description`}
                    rows={2}
                    value={d.description}
                    onChange={(e) => updateDefect(i, { description: e.target.value })}
                    className="field"
                    required={i === 0}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 items-center mt-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    name={`defect-${i}-repairable`}
                    checked={d.repairable}
                    onChange={(e) => updateDefect(i, { repairable: e.target.checked })}
                    className="accent-[var(--color-gold)] h-4 w-4"
                  />
                  Réparable
                </label>
                {d.repairable && (
                  <input
                    name={`defect-${i}-repairNote`}
                    value={d.repairNote}
                    onChange={(e) => updateDefect(i, { repairNote: e.target.value })}
                    placeholder="Comment et à quel coût approximatif ?"
                    className="field"
                  />
                )}
              </div>
              {defects.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDefects((all) => all.filter((_, idx) => idx !== i))}
                  className="btn btn-ghost btn-sm mt-3 !text-[var(--color-danger)]"
                >
                  <Icon name="trash" size={13} /> Retirer ce défaut
                </button>
              )}
            </fieldset>
          ))}
          {defects.length < 8 && (
            <button type="button" onClick={() => setDefects((d) => [...d, { ...EMPTY_DEFECT }])} className="btn btn-outline btn-sm self-start">
              <Icon name="plus" size={14} /> Ajouter un autre défaut
            </button>
          )}
        </div>

        <div className="mt-5 rounded-xl border-2 border-dashed border-[var(--color-sand)] p-4">
          <p className="label">
            Photos du défaut {isEdit ? "(ajouter)" : <span className="text-[var(--color-danger)]">— obligatoire</span>}
          </p>
          <p className="text-xs text-[var(--color-ink-muted)] mb-3">
            Gros plan, bonne lumière, avec un objet pour l&apos;échelle (une pièce, un stylo).
          </p>
          <input name="defectImages" type="file" accept="image/jpeg,image/png,image/webp" multiple className="text-sm" />
          {!isEdit && (
            <textarea
              name="defectImageUrls"
              rows={2}
              className="field mt-3 text-xs"
              placeholder="…ou collez des liens d'images (un par ligne)"
            />
          )}
        </div>
      </Section>

      {/* 4. Prix */}
      <Section n={4} title="Le prix" subtitle="La grille impose une remise minimale selon le grade. On vous guide.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Prix neuf constaté (FCFA)" htmlFor="priceOriginal" hint="Prix catalogue ou prix de vente habituel en magasin.">
            <input
              id="priceOriginal"
              name="priceOriginal"
              type="number"
              min={0}
              step={500}
              value={orig || ""}
              onChange={(e) => setOrig(Number(e.target.value))}
              className="field"
              required
            />
          </Field>
          <Field label="Prix Le Beau Défaut (FCFA)" htmlFor="price">
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step={500}
              value={price || ""}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="field"
              required
            />
          </Field>
        </div>

        <div
          className="mt-4 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: orig && price ? (compliant ? "var(--color-grade-a-bg)" : "var(--color-grade-c-bg)") : "var(--color-cream-deep)" }}
        >
          <div className="flex items-center gap-3">
            <Icon
              name={orig && price ? (compliant ? "check-circle" : "alert") : "info"}
              size={20}
              className={orig && price ? (compliant ? "text-[var(--color-success)]" : "text-[var(--color-danger)]") : "text-[var(--color-ink-muted)]"}
            />
            <div>
              <p className="text-sm font-semibold">
                {orig && price
                  ? price >= orig
                    ? "Le prix doit être inférieur au prix neuf"
                    : compliant
                      ? `Remise de ${pct} % : conforme au ${g.label}`
                      : `Remise de ${pct} % : insuffisante pour un ${g.label} (minimum ${g.minDiscount} %)`
                  : "Renseignez les deux prix"}
              </p>
              {suggested && (
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Fourchette conseillée pour ce grade : {money(suggested.min)} à {money(suggested.max)}
                </p>
              )}
            </div>
          </div>
          {suggested && !compliant && (
            <button type="button" onClick={() => setPrice(suggested.max)} className="btn btn-outline btn-sm">
              Appliquer {money(suggested.max)}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-5 mt-4">
          <Check name="negotiable" label="Prix négociable" defaultChecked={initial?.negotiable} />
        </div>
      </Section>

      {/* 5. Photos */}
      {!isEdit ? (
        <Section n={5} title="Photos de l'article">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--color-sand)] p-4">
              <p className="label">Photo principale</p>
              <input name="coverImage" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
              <input name="coverImageUrl" className="field mt-3 text-xs" placeholder="…ou lien d'une image (https://…)" />
            </div>
            <div className="rounded-xl border border-[var(--color-sand)] p-4">
              <p className="label">Autres vues (facultatif)</p>
              <input name="galleryImages" type="file" accept="image/jpeg,image/png,image/webp" multiple className="text-sm" />
              <textarea name="galleryImageUrls" rows={2} className="field mt-3 text-xs" placeholder="…ou liens, un par ligne" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] mt-3">JPG, PNG ou WebP, 6 Mo maximum par photo.</p>
        </Section>
      ) : (
        <Section n={5} title="Ajouter des photos">
          <input name="galleryImages" type="file" accept="image/jpeg,image/png,image/webp" multiple className="text-sm" />
        </Section>
      )}

      {/* 6. Logistique */}
      <Section n={6} title="Où se trouve l'article ?">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Ville" htmlFor="city">
            <select id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} className="field">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Quartier" htmlFor="quartier">
            <select id="quartier" name="quartier" defaultValue={initial?.quartier ?? ""} className="field" key={city}>
              <option value="">—</option>
              {(QUARTIERS[city] ?? []).map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Check
            name="pickupOnly"
            label="Retrait sur place uniquement (article trop volumineux pour nos livreurs)"
            defaultChecked={initial?.pickupOnly}
          />
        </div>
      </Section>

      {/* Envoi */}
      <div className="surface p-5 flex items-center justify-between gap-4 flex-wrap sticky bottom-3 z-10 shadow-[var(--shadow-lift)]">
        <p className="text-sm text-[var(--color-ink-muted)] max-w-md">
          {isEdit
            ? "Une annonce publiée et modifiée repasse en validation (sous 24 h)."
            : "Notre équipe vérifie la cohérence défaut / photos / prix sous 24 h ouvrées."}
        </p>
        <div className="flex gap-2">
          {!isEdit && (
            <button name="saveAsDraft" value="1" className="btn btn-outline" disabled={pending}>
              Brouillon
            </button>
          )}
          <button className="btn btn-gold" disabled={pending}>
            {pending ? "Envoi…" : isEdit ? "Enregistrer les modifications" : "Envoyer en validation"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ n, title, subtitle, children }: { n: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold flex items-center gap-2.5">
        <span className="h-7 w-7 rounded-full bg-[var(--color-ink)] text-[var(--color-cream)] text-xs font-sans grid place-items-center">
          {n}
        </span>
        {title}
      </h2>
      {subtitle && <p className="text-sm text-[var(--color-ink-muted)] mt-1 ml-[38px]">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--color-ink-muted)] mt-1">{hint}</p>}
    </div>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-[var(--color-gold)] h-4 w-4" />
      {label}
    </label>
  );
}
