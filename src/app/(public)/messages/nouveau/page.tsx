import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireClientSpace } from "@/lib/auth";
import { money } from "@/lib/format";
import { sendMessageAction } from "@/lib/actions/shop";
import { AccountLayout } from "@/components/AccountNav";
import Icon from "@/components/Icon";
import { GradeBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Nouvelle question" };

const SUGGESTIONS = [
  "Le défaut se voit-il une fois l'article en place ?",
  "Pouvez-vous m'envoyer une photo supplémentaire du défaut ?",
  "La livraison est-elle possible ce week-end ?",
  "Le prix est-il négociable ?",
];

export default async function NewThreadPage({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const { produit } = await searchParams;
  const user = await requireClientSpace(`/messages/nouveau?produit=${produit ?? ""}`, "/admin/support");
  if (!produit) redirect("/messages");

  const product = await prisma.product.findUnique({
    where: { id: produit },
    include: { images: { where: { isCover: true }, take: 1 }, seller: { select: { seller: { select: { shopName: true } } } } },
  });
  if (!product) notFound();
  if (product.sellerId === user.id) redirect(`/produit/${product.slug}`);

  const existing = await prisma.thread.findFirst({
    where: {
      productId: product.id,
      AND: [{ members: { some: { userId: user.id } } }, { members: { some: { userId: product.sellerId } } }],
    },
  });
  if (existing) redirect(`/messages/${existing.id}`);

  return (
    <AccountLayout active="/messages" user={user}>
      <Link href={`/produit/${product.slug}`} className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Retour à l&apos;article
      </Link>
      <h1 className="font-display text-[28px] font-bold mb-5">Poser une question au vendeur</h1>

      <div className="surface p-4 flex items-center gap-4 mb-5">
        {product.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt="" className="h-16 w-16 rounded-xl object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold line-clamp-1">{product.title}</p>
          <p className="text-xs text-[var(--color-ink-muted)] flex items-center gap-1.5 mt-0.5">
            <GradeBadge grade={product.defectGrade} size="sm" /> {product.defectSummary}
          </p>
          <p className="text-sm font-semibold mt-1">
            {money(product.price)} · <span className="font-normal text-[var(--color-ink-muted)]">{product.seller.seller?.shopName}</span>
          </p>
        </div>
      </div>

      <form action={sendMessageAction} className="surface p-5 flex flex-col gap-4">
        <input type="hidden" name="productId" value={product.id} />
        <div>
          <label className="label" htmlFor="body">Votre message</label>
          <textarea id="body" name="body" rows={5} required className="field" placeholder="Bonjour, …" />
        </div>
        <div>
          <p className="label">Questions fréquentes</p>
          <ul className="flex flex-col gap-1 text-sm text-[var(--color-ink-muted)]">
            {SUGGESTIONS.map((s) => (
              <li key={s} className="flex gap-2">
                <Icon name="message" size={13} className="mt-1 shrink-0 text-[var(--color-gold)]" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <button className="btn btn-primary">
            <Icon name="arrow-right" size={15} /> Envoyer
          </button>
        </div>
      </form>
    </AccountLayout>
  );
}
