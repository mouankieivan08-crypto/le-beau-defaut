import { redirect } from "next/navigation";

// Le Beau Défaut est le seul vendeur de la plateforme : plus de page « Vendre avec nous ».
export default function SellPage() {
  redirect("/catalogue");
}
