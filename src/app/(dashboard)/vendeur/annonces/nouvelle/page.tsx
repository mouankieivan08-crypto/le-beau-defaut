import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import ProductForm from "@/components/ProductForm";
import Icon from "@/components/Icon";
import { PageHeader, Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Nouvelle annonce" };

export default async function NewListingPage() {
  const user = await requireRole(["VENDEUR", "ADMIN"], "/vendeur/annonces/nouvelle");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, vertical: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  const blocked = user.role === "VENDEUR" && user.seller?.status !== "ACTIF";

  return (
    <div className="max-w-4xl">
      <Link href="/vendeur/annonces" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Mes annonces
      </Link>
      <PageHeader
        title="Nouvelle annonce"
        subtitle="Six étapes, cinq minutes. Le plus important : bien montrer le défaut."
      />

      {blocked && (
        <div className="mb-5">
          <Alert tone="warning" title="Boutique pas encore activée">
            Vous pouvez préparer votre annonce, mais l&apos;envoi sera possible dès que notre équipe aura validé votre
            boutique.
          </Alert>
        </div>
      )}

      <ProductForm categories={categories} defaultCity={user.seller?.city ?? user.city ?? "Brazzaville"} />
    </div>
  );
}
