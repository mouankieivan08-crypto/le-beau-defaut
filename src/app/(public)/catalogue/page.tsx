import type { Metadata } from 'next';
import CatalogueView from '@/components/CatalogueView';
import type { CatalogueParams } from '@/lib/queries';

export const metadata: Metadata = { title: 'Catalogue' };

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
