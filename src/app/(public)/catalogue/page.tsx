import type { Metadata } from 'next';
import CatalogueView from '@/components/CatalogueView';
import type { CatalogueParams } from '@/lib/queries';

export const metadata: Metadata = {
  title: "Catalogue — meubles neufs à petit défaut",
  description:
    "Canapés, tables, rangements, chaises : des meubles neufs, invendus ou à léger défaut, jusqu'à 70 % moins cher à Brazzaville. Filtrez par type de défaut, prix et quartier.",
  // Les vues filtrées (?grade=B, ?prixMax=…) renvoient à la page principale du catalogue.
  alternates: { canonical: "/catalogue" },
};

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  ) as CatalogueParams;

  return <CatalogueView params={params} />;
}
