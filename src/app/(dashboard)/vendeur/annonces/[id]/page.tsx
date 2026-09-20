import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth";
import { PRODUCT_STATUS } from "@/lib/constants";
import { deleteProductImageAction } from "@/lib/actions/seller";
import ProductForm from "@/components/ProductForm";
import Icon from "@/components/Icon";
import { PageHeader, Alert, Badge, Card } from "@/components/ui";

export const metadata: Metadata = { title: "Modifier l'annonce" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSeller(`/vendeur/annonces/${id}`);

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { position: "asc" } }, defects: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, vertical: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    }),
  ]);
  if (!product || (product.sellerId !== user.id && user.role !== "ADMIN")) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/vendeur/annonces" className="btn btn-ghost btn-sm mb-3 -ml-2">
        <Icon name="arrow-left" size={14} /> Mes annonces
      </Link>
      <PageHeader
        title="Modifier l'annonce"
        subtitle={`${product.reference} · ${product.title}`}
        action={<Badge tone={PRODUCT_STATUS[product.status].tone}>{PRODUCT_STATUS[product.status].label}</Badge>}
      />

      {product.status === "REJETE" && product.rejectionReason && (
        <div className="mb-5">
          <Alert tone="danger" title="À corriger avant nouvelle validation">
            {product.rejectionReason}
          </Alert>
        </div>
      )}

      <Card className="mb-6">
        <h2 className="font-display text-lg font-bold mb-3">Photos actuelles</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {product.images.map((img) => (
            <div key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              {img.isCover && (
                <span className="absolute bottom-1 left-1 chip bg-[var(--color-ink)] text-[var(--color-cream)] !text-[9px]">
                  Principale
                </span>
              )}
              {img.isDefect && (
                <span className="absolute bottom-1 left-1 chip bg-[var(--color-danger)] text-white !text-[9px]">Défaut</span>
              )}
              {!img.isCover && (
                <form action={deleteProductImageAction} className="absolute top-1 right-1">
                  <input type="hidden" name="imageId" value={img.id} />
                  <button
                    className="h-7 w-7 grid place-items-center rounded-full bg-[var(--color-linen)]/95 text-[var(--color-danger)] shadow-sm"
                    aria-label="Supprimer cette photo"
                  >
                    <Icon name="trash" size={12} />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </Card>

      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          title: product.title,
          description: product.description,
          vertical: product.vertical,
          categoryId: product.categoryId,
          priceOriginal: product.priceOriginal,
          price: product.price,
          defectGrade: product.defectGrade,
          defectSummary: product.defectSummary,
          quantity: product.quantity,
          city: product.city,
          quartier: product.quartier,
          brand: product.brand,
          material: product.material,
          color: product.color,
          dimensions: product.dimensions,
          weightKg: product.weightKg,
          negotiable: product.negotiable,
          pickupOnly: product.pickupOnly,
          serialNumber: product.serialNumber,
          hasDustBag: product.hasDustBag,
          hasCertif: product.hasCertif,
          defects: product.defects.map((d) => ({
            type: d.type,
            zone: d.zone,
            severity: d.severity,
            description: d.description,
            repairable: d.repairable,
            repairNote: d.repairNote ?? "",
          })),
        }}
      />
    </div>
  );
}
