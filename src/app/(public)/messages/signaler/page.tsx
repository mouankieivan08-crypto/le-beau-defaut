import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { reportProductAction } from "@/lib/actions/shop";
import { REPORT_REASONS } from "@/lib/constants";
import { money } from "@/lib/format";
import { AccountLayout } from "@/components/AccountNav";
import ActionForm from "@/components/ActionForm";
import Icon from "@/components/Icon";
import { GradeBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Signaler une annonce", robots: { index: false } };

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const { produit } = await searchParams;
  const user = await requireUser(`/messages/signaler?produit=${produit ?? ""}`);
  if (!produit) redirect("/messages");

  const product = await prisma.product.findUnique({
    where: { id: produit },
    select: { id: true, title: true, slug: true, price: true, defectGrade: true, images: { where: { isCover: true }, take: 1 } },
  });
  if (!product) notFound();

  return (
    <AccountLayout active="/messages" user={user}>
      <Link href={`/produit/${product.slug}`} className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Retour à l&apos;article
      </Link>
      <h1 className="font-display text-[28px] font-bold mb-1">Signaler cette annonce</h1>
      <p className="text-sm text-[var(--color-ink-muted)] mb-5">
        Quelque chose ne va pas ? L&apos;équipe vérifie chaque signalement et vous répond dans vos messages.
      </p>

      <div className="surface p-4 flex items-center gap-4 mb-5">
        {product.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt="" className="h-16 w-16 rounded-xl object-cover" />
        )}
        <div className="min-w-0">
          <p className="font-display font-semibold line-clamp-1">{product.title}</p>
          <p className="text-sm flex items-center gap-1.5 mt-1">
            <GradeBadge grade={product.defectGrade} size="sm" /> {money(product.price)}
          </p>
        </div>
      </div>

      <ActionForm action={reportProductAction} submitLabel="Envoyer le signalement" pendingLabel="Envoi…" className="surface p-5">
        <input type="hidden" name="productId" value={product.id} />
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="label">Motif</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPORT_REASONS.map((r, i) => (
                <label key={r.key} className="flex items-center gap-2 text-sm p-2.5 rounded-lg border border-[var(--color-sand)] cursor-pointer">
                  <input type="radio" name="reason" value={r.key} defaultChecked={i === 0} className="accent-[var(--color-gold)]" />
                  {r.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="details">
              Détails (facultatif)
            </label>
            <textarea id="details" name="details" rows={4} className="field" placeholder="Expliquez ce que vous avez remarqué…" />
          </div>
        </div>
      </ActionForm>
    </AccountLayout>
  );
}
