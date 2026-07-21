'use client';

import {
  Skeleton,
  SkeletonCircle,
  SkeletonSoft,
} from '@/shared/components/feedback/Skeleton';

export function ProjectTeamSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <PersonCompletionsChartSkeleton />
      <ProjectTeamPanelSkeleton />
    </div>
  );
}

export function PersonCompletionsChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Skeleton className="h-5 w-48" />
          <SkeletonSoft className="mt-2 h-3.5 w-64 max-w-full" />
        </div>
        <Skeleton className="h-8 w-40 rounded-lg" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg bg-gray-50 px-3 py-2">
            <SkeletonSoft className="h-3 w-16" />
            <Skeleton className="mt-2 h-5 w-10" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex min-h-[220px] items-end gap-2 rounded-lg border border-dashed border-gray-100 bg-gray-50/60 p-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="flex-1 rounded-t-md bg-indigo-100/60"
            style={{ height: `${35 + ((index * 17) % 55)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TeamMembersListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-3">
            <SkeletonCircle className="h-9 w-9" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <SkeletonSoft className="h-3 w-44" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <SkeletonSoft className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectTeamPanelSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <Skeleton className="h-5 w-28" />
          <SkeletonSoft className="mt-1.5 h-3.5 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="p-5">
        <TeamMembersListSkeleton />
      </div>
    </div>
  );
}

/** Chart plot area only — used while selected members' data loads. */
export function ChartPlotSkeleton() {
  return (
    <div className="mt-6 flex min-h-[220px] animate-pulse items-end gap-2 rounded-lg border border-dashed border-gray-100 bg-gray-50/60 p-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="flex-1 rounded-t-md bg-indigo-100/60"
          style={{ height: `${35 + ((index * 17) % 55)}%` }}
        />
      ))}
    </div>
  );
}
