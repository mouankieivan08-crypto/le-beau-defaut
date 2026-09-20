import { Line, StatsSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="animate-fade-up" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div className="flex flex-col gap-3 mb-6">
        <Line w="28%" h={24} />
        <Line w="45%" h={11} />
      </div>
      <StatsSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5 mt-6">
        <div className="surface p-5">
          <div className="shimmer h-[220px] w-full rounded-lg" />
        </div>
        <div className="surface p-5 flex flex-col gap-3">
          <Line w="60%" h={14} />
          <Line h={10} />
          <Line w="85%" h={10} />
          <Line w="70%" h={10} />
        </div>
      </div>
    </div>
  );
}
