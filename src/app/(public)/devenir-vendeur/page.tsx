import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function BecomeSellerPage() {
  const user = await requireUser("/catalogue");
  redirect("/catalogue");
}
