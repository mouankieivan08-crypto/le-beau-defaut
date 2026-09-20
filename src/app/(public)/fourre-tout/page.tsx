import type { Metadata } from "next";
import CatalogueView from "@/components/CatalogueView";
import type { CatalogueParams } from "@/lib/queries";

const INTRO =
  "Décoration, luminaires, électroménager, tapis, miroirs. Le rayon des trouvailles, avec la même règle : le défaut est annoncé.";

export const metadata: Metadata = { title: "Fourre-tout", description: INTRO };

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
    vertical: "FOURRE_TOUT",
  };

  return <CatalogueView params={params} basePath="/fourre-tout" heading="Fourre-tout" intro={INTRO} />;
}
