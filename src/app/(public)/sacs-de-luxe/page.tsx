import type { Metadata } from "next";
import CatalogueView from "@/components/CatalogueView";
import type { CatalogueParams } from "@/lib/queries";

const INTRO =
  "Pièces de luxe passées par notre contrôle d'authenticité. Coin frotté, doublure marquée, poignée patinée — tout est décrit et photographié.";

export const metadata: Metadata = { title: "Sacs de luxe", description: INTRO };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = {
    ...(Object.fromEntries(
      Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
    ) as CatalogueParams),
    vertical: "SACS",
  };

  return <CatalogueView params={params} basePath="/sacs-de-luxe" heading="Sacs de luxe" intro={INTRO} />;
}
