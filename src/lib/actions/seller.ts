"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSeller, requireUser } from "@/lib/auth";
import { slugify, discountPct } from "@/lib/format";
import { resolveImage, saveImages } from "@/lib/upload";
import { gradeOf, saleModeForVertical } from "@/lib/constants";

type State = { error?: string; success?: string } | undefined;

const VERTICAL_PREFIX: Record<string, string> = { MOBILIER: "M" };

async function nextProductReference(vertical: string) {
  const count = await prisma.product.count({ where: { vertical } });
  return `LBD-${VERTICAL_PREFIX[vertical] ?? "M"}-${String(count + 1).padStart(5, "0")}`;
}

const productSchema = z.object({
  title: z.string().min(5, "Le titre doit faire au moins 5 caractères").max(120),
  description: z.string().min(20, "Décrivez l'article en 20 caractères minimum"),
  vertical: z.literal("MOBILIER"),
  categoryId: z.string().min(1, "Choisissez une catégorie"),
  priceOriginal: z.number().int().positive("Prix d'origine invalide"),
  price: z.number().int().positive("Prix de vente invalide"),
  defectGrade: z.enum(["A", "B", "C"]),
  defectSummary: z.string().min(10, "Résumez le défaut en une phrase (10 caractères minimum)").max(200),
  quantity: z.number().int().min(1).max(999),
  city: z.string().min(2),
});

function readProductForm(formData: FormData) {
  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    vertical: String(formData.get("vertical") || "MOBILIER"),
    categoryId: String(formData.get("categoryId") || ""),
    priceOriginal: Number(formData.get("priceOriginal") || 0),
    price: Number(formData.get("price") || 0),
    defectGrade: String(formData.get("defectGrade") || "A"),
    defectSummary: String(formData.get("defectSummary") || "").trim(),
    quantity: Number(formData.get("quantity") || 1),
    city: String(formData.get("city") || "Brazzaville"),
  };
}

function readExtras(formData: FormData) {
  return {
    brand: String(formData.get("brand") || "").trim() || null,
    material: String(formData.get("material") || "").trim() || null,
    color: String(formData.get("color") || "").trim() || null,
    dimensions: String(formData.get("dimensions") || "").trim() || null,
    weightKg: Number(formData.get("weightKg") || 0) || null,
    quartier: String(formData.get("quartier") || "").trim() || null,
    negotiable: formData.get("negotiable") === "on",
    deliverable: formData.get("deliverable") !== "off",
    pickupOnly: formData.get("pickupOnly") === "on",
    serialNumber: String(formData.get("serialNumber") || "").trim() || null,
  };
}

/** Les défauts détaillés arrivent sous forme de champs indexés defect-0-type, defect-0-zone, ... */
function readDefects(formData: FormData) {
  const out: { type: string; zone: string; severity: number; description: string; repairable: boolean; repairNote: string | null }[] =
    [];
  for (let i = 0; i < 8; i++) {
    const type = String(formData.get(`defect-${i}-type`) || "").trim();
    const description = String(formData.get(`defect-${i}-description`) || "").trim();
    if (!type || !description) continue;
    out.push({
      type,
      zone: String(formData.get(`defect-${i}-zone`) || "Non précisé").trim(),
      severity: Math.min(5, Math.max(1, Number(formData.get(`defect-${i}-severity`) || 1))),
      description,
      repairable: formData.get(`defect-${i}-repairable`) === "on",
      repairNote: String(formData.get(`defect-${i}-repairNote`) || "").trim() || null,
    });
  }
  return out;
}

export async function createProductAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireSeller("/vendeur/annonces/nouvelle");
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: user.id } });
  if (user.role === "VENDEUR" && seller?.status !== "ACTIF") {
    return { error: "Votre boutique doit être validée par un administrateur avant de publier." };
  }

  const base = readProductForm(formData);
  const parsed = productSchema.safeParse(base);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Le mobilier appartient à Le Beau Défaut : seule la boutique maison peut le mettre en ligne.
  const isHouse = user.role === "ADMIN" || seller?.isHouse === true;

  // Un administrateur n'a pas de boutique à lui : ce qu'il publie appartient à la
  // boutique maison, celle sous laquelle Le Beau Défaut vend son propre stock.
  const houseShop = user.role === "ADMIN" && !seller ? await prisma.sellerProfile.findFirst({ where: { isHouse: true } }) : null;
  const ownerId = houseShop?.userId ?? user.id;
  if (!isHouse && saleModeForVertical(d.vertical) === "MAISON") {
    return {
      error: "Le mobilier est vendu par Le Beau Défaut. Contactez notre équipe pour proposer un lot.",
    };
  }

  if (d.price >= d.priceOriginal) {
    return { error: "Le prix Le Beau Défaut doit être inférieur au prix d'origine." };
  }

  const defects = readDefects(formData);
  if (defects.length === 0) {
    return { error: "Déclarez au moins un défaut : c'est la règle de la maison." };
  }

  const pct = discountPct(d.priceOriginal, d.price);
  const g = gradeOf(d.defectGrade);
  if (pct < g.minDiscount) {
    return {
      error: `Pour un ${g.label} (${g.name}), la remise attendue est d'au moins ${g.minDiscount} %. Votre remise actuelle est de ${pct} %.`,
    };
  }

  // Images
  const coverFile = formData.get("coverImage") as File | null;
  const coverUrl = await resolveImage(coverFile, String(formData.get("coverImageUrl") || ""));
  if (!coverUrl) return { error: "Une photo principale est obligatoire (fichier ou lien)." };

  const galleryFiles = formData.getAll("galleryImages").filter((f): f is File => f instanceof File);
  const galleryUrls = await saveImages(galleryFiles);
  const extraUrls = String(formData.get("galleryImageUrls") || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\/.+/i.test(s) || s.startsWith("/"));

  const defectFiles = formData.getAll("defectImages").filter((f): f is File => f instanceof File);
  const defectUrls = await saveImages(defectFiles);
  const defectExtraUrls = String(formData.get("defectImageUrls") || "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\/.+/i.test(s) || s.startsWith("/"));

  const allDefectPhotos = [...defectUrls, ...defectExtraUrls];
  if (allDefectPhotos.length === 0) {
    return { error: "Ajoutez au moins une photo qui montre le défaut. La transparence, c'est la marque." };
  }

  let slug = slugify(d.title);
  if (await prisma.product.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const extras = readExtras(formData);
  const reference = await nextProductReference(d.vertical);
  const asDraft = formData.get("saveAsDraft") === "1";

  const product = await prisma.product.create({
    data: {
      reference,
      slug,
      title: d.title,
      description: d.description,
      vertical: d.vertical,
      saleMode: saleModeForVertical(d.vertical),
      supplierName: isHouse ? String(formData.get("supplierName") || "").trim() || null : null,
      categoryId: d.categoryId,
      sellerId: ownerId,
      priceOriginal: d.priceOriginal,
      price: d.price,
      discountPct: pct,
      defectGrade: d.defectGrade,
      defectSummary: d.defectSummary,
      quantity: d.quantity,
      city: d.city,
      ...extras,
      status: asDraft ? "BROUILLON" : user.role === "ADMIN" ? "PUBLIE" : "EN_ATTENTE",
      publishedAt: !asDraft && user.role === "ADMIN" ? new Date() : null,
      images: {
        create: [
          { url: coverUrl, isCover: true, position: 0, alt: d.title },
          ...[...galleryUrls, ...extraUrls].map((url, i) => ({ url, position: i + 1, alt: d.title })),
          ...allDefectPhotos.map((url, i) => ({
            url,
            position: 100 + i,
            isDefect: true,
            alt: `Défaut — ${d.defectSummary}`,
          })),
        ],
      },
      defects: {
        create: defects.map((df, i) => ({ ...df, photoUrl: allDefectPhotos[i] ?? allDefectPhotos[0] ?? null })),
      },
    },
  });

  if (!asDraft) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "ANNONCE",
        title: "Annonce à valider",
        body: `${d.title} — ${reference}`,
        link: `/admin/annonces/${product.id}`,
      })),
    });
  }

  revalidatePath("/", "layout");
  // L'équipe retourne dans son espace, le vendeur dans le sien.
  redirect(
    user.role === "ADMIN"
      ? `/admin/annonces?statut=PUBLIE&cree=${product.reference}`
      : `/vendeur/annonces?cree=${product.reference}`
  );
}

export async function updateProductAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireSeller();
  const id = String(formData.get("productId") || "");

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return { error: "Annonce introuvable." };
  if (existing.sellerId !== user.id && user.role !== "ADMIN") return { error: "Accès refusé." };

  const base = readProductForm(formData);
  const parsed = productSchema.safeParse(base);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.price >= d.priceOriginal) return { error: "Le prix doit rester inférieur au prix d'origine." };

  // Même règle qu'à la création : le mobilier est réservé à la boutique maison.
  const isHouse = user.role === "ADMIN" || user.seller?.isHouse === true;
  if (!isHouse && saleModeForVertical(d.vertical) === "MAISON") {
    return { error: "Le mobilier est vendu par Le Beau Défaut : cette annonce reste réservée à la boutique maison." };
  }

  const pct = discountPct(d.priceOriginal, d.price);
  const g = gradeOf(d.defectGrade);
  if (pct < g.minDiscount) {
    return { error: `Un ${g.label} demande au moins ${g.minDiscount} % de remise (actuellement ${pct} %).` };
  }

  const extras = readExtras(formData);

  // Une annonce modifiée après publication repasse en validation.
  const nextStatus =
    existing.status === "PUBLIE" || existing.status === "REJETE" ? "EN_ATTENTE" : existing.status;

  await prisma.product.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description,
      vertical: d.vertical,
      saleMode: saleModeForVertical(d.vertical),
      ...(isHouse ? { supplierName: String(formData.get("supplierName") || "").trim() || null } : {}),
      categoryId: d.categoryId,
      priceOriginal: d.priceOriginal,
      price: d.price,
      discountPct: pct,
      defectGrade: d.defectGrade,
      defectSummary: d.defectSummary,
      quantity: d.quantity,
      city: d.city,
      ...extras,
      status: nextStatus,
      rejectionReason: null,
    },
  });

  // Nouvelles photos éventuelles (vues générales et gros plans du défaut)
  const galleryFiles = formData.getAll("galleryImages").filter((f): f is File => f instanceof File);
  const urls = await saveImages(galleryFiles);
  const defectFiles = formData.getAll("defectImages").filter((f): f is File => f instanceof File);
  const defectUrls = await saveImages(defectFiles);
  const count = await prisma.productImage.count({ where: { productId: id } });
  if (urls.length || defectUrls.length) {
    await prisma.productImage.createMany({
      data: [
        ...urls.map((url, i) => ({ productId: id, url, position: count + i, alt: d.title })),
        ...defectUrls.map((url, i) => ({ productId: id, url, position: 100 + count + i, isDefect: true, alt: `Défaut — ${d.defectSummary}` })),
      ],
    });
  }

  // Les défauts détaillés sont remplacés par ceux du formulaire
  const defects = readDefects(formData);
  if (defects.length > 0) {
    const defectPhoto =
      defectUrls[0] ??
      (await prisma.productImage.findFirst({ where: { productId: id, isDefect: true }, orderBy: { position: "asc" } }))?.url ??
      null;
    await prisma.$transaction([
      prisma.defect.deleteMany({ where: { productId: id } }),
      prisma.defect.createMany({
        data: defects.map((df, i) => ({ ...df, productId: id, photoUrl: defectUrls[i] ?? defectPhoto })),
      }),
    ]);
  }

  revalidatePath("/", "layout");
  return {
    success:
      nextStatus === "EN_ATTENTE"
        ? "Annonce mise à jour. Elle repasse en validation."
        : "Annonce mise à jour.",
  };
}

export async function deleteProductImageAction(formData: FormData) {
  const user = await requireSeller();
  const imageId = String(formData.get("imageId") || "");
  const image = await prisma.productImage.findUnique({ where: { id: imageId }, include: { product: true } });
  if (!image) return;
  if (image.product.sellerId !== user.id && user.role !== "ADMIN") return;
  if (image.isCover) return; // la photo principale ne peut pas être supprimée seule
  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath("/", "layout");
}

export async function changeProductStatusAction(formData: FormData) {
  const user = await requireSeller();
  const id = String(formData.get("productId") || "");
  const status = String(formData.get("status") || "");
  if (!["BROUILLON", "EN_ATTENTE", "ARCHIVE"].includes(status)) return;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return;
  if (product.sellerId !== user.id && user.role !== "ADMIN") return;

  await prisma.product.update({ where: { id }, data: { status } });
  revalidatePath("/", "layout");
}

export async function deleteProductAction(formData: FormData) {
  const user = await requireSeller();
  const id = String(formData.get("productId") || "");
  const product = await prisma.product.findUnique({
    where: { id },
    include: { orderItems: { take: 1 } },
  });
  if (!product) return;
  if (product.sellerId !== user.id && user.role !== "ADMIN") return;

  // Une annonce déjà vendue est archivée, jamais effacée (historique des commandes).
  if (product.orderItems.length > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVE" } });
  } else {
    await prisma.product.delete({ where: { id } });
  }
  revalidatePath("/", "layout");
}

const shopSchema = z.object({
  shopName: z.string().min(2, "Nom de boutique trop court"),
  description: z.string().optional(),
  contactPhone: z.string().min(9, "Téléphone invalide"),
  address: z.string().optional(),
  city: z.string().min(2),
  rccm: z.string().optional(),
  niu: z.string().optional(),
  mobileMoney: z.string().optional(),
  mobileMoneyOp: z.string().optional(),
});

export async function updateShopAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireSeller("/vendeur/boutique");
  const parsed = shopSchema.safeParse({
    shopName: String(formData.get("shopName") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    contactPhone: String(formData.get("contactPhone") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    city: String(formData.get("city") || "Brazzaville"),
    rccm: String(formData.get("rccm") || "").trim(),
    niu: String(formData.get("niu") || "").trim(),
    mobileMoney: String(formData.get("mobileMoney") || "").trim(),
    mobileMoneyOp: String(formData.get("mobileMoneyOp") || ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const logo = await resolveImage(formData.get("logo") as File | null, String(formData.get("logoUrl") || ""));

  await prisma.sellerProfile.update({
    where: { userId: user.id },
    data: { ...parsed.data, ...(logo ? { logoUrl: logo } : {}) },
  });

  revalidatePath("/", "layout");
  return { success: "Boutique mise à jour." };
}

/* ---------------------------- Ouvrir une boutique ---------------------------- */

/**
 * Ouverture de boutique désactivée : Le Beau Défaut est le seul vendeur.
 */
export async function becomeSellerAction(_prev: State, _formData: FormData): Promise<State> {
  await requireUser("/catalogue");
  // Le Beau Défaut est le seul vendeur : on n'ouvre plus de boutiques extérieures.
  return { error: "Le Beau Défaut est le seul vendeur de la plateforme." };
}
