import { Line, GridSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 animate-fade-up" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement de l&apos;article…</span>
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
        <div className="shimmer aspect-[4/3] w-full rounded-[14px]" />
        <div className="flex flex-col gap-4">
          <Line w="35%" h={10} />
          <Line w="85%" h={30} />
          <div className="surface p-5 flex flex-col gap-3">
            <Line w="50%" h={26} />
            <Line w="70%" h={12} />
            <Line w="40%" h={12} />
          </div>
          <div className="shimmer h-12 w-full rounded-full" />
          <div className="surface p-5 flex flex-col gap-2.5">
            <Line w="80%" h={12} />
            <Line w="65%" h={12} />
          </div>
        </div>
      </div>
      <div className="mt-12">
        <GridSkeleton count={4} />
      </div>
    </div>
  );
}
