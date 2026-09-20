import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { cardSelect } from "@/lib/queries";
import { AccountLayout } from "@/components/AccountNav";
import ProductCard from "@/components/ProductCard";
import { EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Mes favoris" };

export default async function FavoritesPage() {
  const user = await requireUser("/compte/favoris");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { product: { select: { ...cardSelect, status: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AccountLayout active="/compte/favoris" user={user}>
      <div className="flex items-end justify-between gap-3 mb-5">
        <h1 className="font-display text-[28px] font-bold">Mes favoris</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {favorites.length} article{favorites.length > 1 ? "s" : ""}
        </p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon="heart"
          title="Aucun favori pour l'instant"
          message="Touchez le cœur sur un article pour le retrouver ici. Pratique pour comparer les défauts avant de vous décider."
          action={
            <Link href="/catalogue" className="btn btn-primary">
              Parcourir le catalogue
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((f) => (
            <ProductCard
              key={f.id}
              product={{ ...f.product, quantity: f.product.status === "PUBLIE" ? f.product.quantity : 0 }}
              isFavorite
              revalidate="/compte/favoris"
            />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
