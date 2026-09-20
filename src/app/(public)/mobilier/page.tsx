import type { Metadata } from "next";
import CatalogueView from "@/components/CatalogueView";
import type { CatalogueParams } from "@/lib/queries";

const INTRO =
  "Canapés, tables, chaises, rangements, literie. Du stock d'entreprise repris tel quel : on annonce le défaut, on ajuste le prix.";

export const metadata: Metadata = { title: "Mobilier", description: INTRO };

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
    vertical: "MOBILIER",
  };

  return <CatalogueView params={params} basePath="/mobilier" heading="Mobilier" intro={INTRO} />;
}
