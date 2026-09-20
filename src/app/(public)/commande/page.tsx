import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import CheckoutForm from "@/components/CheckoutForm";
import { Breadcrumb } from "@/components/ui";

export const metadata: Metadata = { title: "Finaliser la commande" };

export default async function CheckoutPage() {
  const user = await requireUser("/commande");

  const [items, zones, address, setting] = await Promise.all([
    prisma.cartItem.findMany({
      where: { userId: user.id, product: { status: "PUBLIE", quantity: { gt: 0 } } },
      include: { product: { include: { images: { where: { isCover: true }, take: 1 } } } },
    }),
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ city: "asc" }, { fee: "asc" }] }),
    prisma.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }),
    prisma.setting.findUnique({ where: { key: "delivery.defaultFee" } }),
  ]);

  if (items.length === 0) redirect("/panier");

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8">
      <Breadcrumb items={[{ label: "Panier", href: "/panier" }, { label: "Commande" }]} />
      <h1 className="font-display text-[32px] font-bold mb-6">Finaliser la commande</h1>
      <CheckoutForm
        zones={zones.map((z) => ({ city: z.city, name: z.name, fee: z.fee, etaHours: z.etaHours }))}
        lines={items.map((i) => ({
          id: i.id,
          title: i.product.title,
          image: i.product.images[0]?.url ?? null,
          qty: Math.min(i.quantity, i.product.quantity),
          price: i.product.price,
          grade: i.product.defectGrade,
          pickupOnly: i.product.pickupOnly,
        }))}
        address={
          address
            ? { fullName: address.fullName, phone: address.phone, city: address.city, quartier: address.quartier, landmark: address.landmark }
            : { fullName: `${user.firstName} ${user.lastName}`, phone: user.phone ?? "", city: user.city ?? "Brazzaville", quartier: user.quartier ?? "", landmark: null }
        }
        defaultFee={Number(setting?.value ?? 3000)}
      />
    </div>
  );
}
