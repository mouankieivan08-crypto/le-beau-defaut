import { redirect } from "next/navigation";

// Plus de boutiques de vendeurs : Le Beau Défaut est la seule boutique. Les anciens liens mènent au catalogue.
export default function ShopPublicPage() {
  redirect("/catalogue");
}
