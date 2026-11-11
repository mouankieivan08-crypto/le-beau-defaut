import { redirect } from "next/navigation";

// Le Beau Défaut est le seul vendeur : plus de vendeurs, de séquestre ni de versements à gérer.
export default function Page() {
  redirect("/admin");
}
