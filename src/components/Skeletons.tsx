/**
 * Écrans d'attente. Sur une connexion lente, mieux vaut voir la forme de la page
 * arriver qu'un écran blanc : l'attente paraît deux fois plus courte.
 */

export function Line({ w = "100%", h = 12 }: { w?: string | number; h?: number }) {
  return <span className="shimmer block rounded-full" style={{ width: w, height: h }} />;
}

export function CardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <div className="shimmer aspect-[4/3] w-full" />
      <div className="p-3.5 flex flex-col gap-2">
        <Line w="45%" h={9} />
        <Line w="90%" h={14} />
        <Line w="70%" h={10} />
        <Line w="55%" h={16} />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="surface p-4 flex flex-col gap-2.5">
          <Line w="60%" h={9} />
          <Line w="45%" h={22} />
          <Line w="70%" h={9} />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 animate-fade-up" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div className="flex flex-col gap-3 mb-7">
        <Line w="30%" h={28} />
        <Line w="55%" h={12} />
      </div>
      {children ?? <GridSkeleton />}
    </div>
  );
}
