import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import ProductForm from "@/components/ProductForm";
import Icon from "@/components/Icon";
import { PageHeader, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Publier un article" };

/**
 * Mise en ligne d'un article du stock maison, depuis l'administration.
 *
 * C'est ici que Le Beau Défaut publie ce qu'il vend en son nom : mobilier et sacs
 * de luxe rachetés aux entreprises. L'annonce part directement en ligne — l'équipe
 * n'a pas à se modérer elle-même — et elle est rattachée à la boutique maison.
 */
export default async function AdminNewListingPage() {
  await requireAdmin("/admin/annonces/nouvelle");

  const [categories, house] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, vertical: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
    prisma.sellerProfile.findFirst({ where: { isHouse: true }, select: { shopName: true, city: true } }),
  ]);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/annonces" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Toutes les annonces
      </Link>

      <PageHeader
        title="Publier un article"
        subtitle="Le stock de Le Beau Défaut : mobilier, sacs de luxe, ou fourre-tout si l'article nous appartient."
      />

      <div className="mb-5">
        {house ? (
          <Alert tone="info" title={`Publié sous « ${house.shopName} »`}>
            L&apos;article sera marqué <strong>vendu par Le Beau Défaut</strong> et mis en ligne immédiatement,
            sans passer par la file de modération. Indiquez le fournisseur d&apos;origine : il apparaîtra sur la
            fiche (« racheté à… »).
          </Alert>
        ) : (
          <Alert tone="warning" title="Boutique maison introuvable">
            Aucune boutique n&apos;est marquée comme boutique maison en base. L&apos;article serait publié sans
            vendeur : créez d&apos;abord la boutique maison depuis <Link href="/admin/vendeurs" className="underline">Vendeurs</Link>.
          </Alert>
        )}
      </div>

      <ProductForm
        categories={categories}
        defaultCity={house?.city ?? "Brazzaville"}
        isHouse
      />
    </div>
  );
}
