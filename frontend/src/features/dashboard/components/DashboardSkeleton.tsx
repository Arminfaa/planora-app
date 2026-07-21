'use client';

import { Skeleton, SkeletonSoft } from '@/shared/components/feedback/Skeleton';

export function DashboardSkeleton() {
  return (
    <div
      className="min-h-[calc(100vh-4rem)] animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative overflow-hidden border-b border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Skeleton className="h-9 w-56 max-w-full rounded-lg bg-indigo-100/80 sm:h-10 sm:w-72" />
              <SkeletonSoft className="mt-3 h-4 w-72 max-w-full bg-indigo-50" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Skeleton className="h-10 w-full rounded-xl bg-white/80 sm:w-60" />
              <Skeleton className="h-10 w-36 rounded-xl bg-indigo-200/70" />
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md"
              >
                <div className="flex h-full items-center gap-3 p-4">
                  <SkeletonCircleSoft />
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonSoft className="h-3 w-16 bg-gray-100" />
                    <Skeleton className="h-5 w-12 bg-gray-200/70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-40" />
          <SkeletonSoft className="h-4 w-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="h-1 bg-indigo-100" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4 max-w-[12rem]" />
                <SkeletonSoft className="h-3.5 w-full" />
                <SkeletonSoft className="h-3.5 w-2/3" />
                <div className="flex items-center gap-2 pt-2">
                  <SkeletonSoft className="h-6 w-16 rounded-full" />
                  <SkeletonSoft className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonCircleSoft() {
  return (
    <div
      aria-hidden
      className="h-10 w-10 shrink-0 rounded-xl bg-indigo-100/80"
    />
  );
}
