'use client';

import { Skeleton, SkeletonSoft } from '@/shared/components/feedback/Skeleton';

export function KanbanBoardSkeleton() {
  return (
    <div
      className="relative flex min-h-[calc(100dvh-4rem)] w-full animate-pulse flex-col px-4 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(99,102,241,0.35),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_80%,rgba(139,92,246,0.25),transparent_45%)]" />

      <div className="relative flex flex-col">
        <div className="relative z-20 shrink-0 py-6">
          <SkeletonSoft className="mb-4 h-4 w-32 bg-white/20" />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Skeleton className="h-9 w-56 max-w-full rounded-lg bg-white/25 sm:h-10 sm:w-72" />
              <div className="mt-2 flex flex-wrap gap-2">
                <SkeletonSoft className="h-3.5 w-24 bg-white/15" />
                <SkeletonSoft className="h-3.5 w-20 bg-white/15" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-full bg-emerald-400/30" />
              <Skeleton className="h-9 w-28 rounded-lg bg-white/20" />
              <Skeleton className="h-9 w-10 rounded-lg bg-white/20" />
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-2 h-[calc(100dvh-1rem)] overflow-x-auto overflow-y-hidden pb-2 max-sm:-mx-4 max-sm:px-4">
          <div className="flex h-full gap-4 pb-4">
            {Array.from({ length: 4 }).map((_, col) => (
              <KanbanColumnSkeleton key={col} cardCount={3 + (col % 3)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanColumnSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="flex h-full max-h-full w-[calc(100dvw-2rem)] min-w-[calc(100dvw-2rem)] shrink-0 flex-col rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl sm:w-72 sm:min-w-0">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-28 bg-white/30" />
          <SkeletonSoft className="h-5 w-6 rounded-full bg-white/15" />
        </div>
        <SkeletonSoft className="mt-3 h-8 w-full rounded-lg bg-white/10" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3">
        {Array.from({ length: cardCount }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-white/10 bg-white p-3 shadow-sm"
          >
            <Skeleton className="h-3.5 w-4/5" />
            <SkeletonSoft className="mt-2 h-3 w-full" />
            <SkeletonSoft className="mt-1.5 h-3 w-2/3" />
            <div className="mt-3 flex items-center justify-between gap-2">
              <SkeletonSoft className="h-5 w-12 rounded-full" />
              <div className="h-6 w-6 rounded-full bg-gray-200/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
