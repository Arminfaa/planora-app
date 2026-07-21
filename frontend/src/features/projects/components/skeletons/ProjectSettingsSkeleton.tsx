'use client';

import { Skeleton, SkeletonSoft } from '@/shared/components/feedback/Skeleton';

export function ProjectSettingsSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl animate-pulse space-y-8 px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Skeleton className="h-6 w-40" />
            <SkeletonSoft className="mt-2 h-3.5 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <div className="mt-5 space-y-3">
          <SkeletonSoft className="h-4 w-48" />
          <SkeletonSoft className="h-4 w-64 max-w-full" />
        </div>
      </section>

      <ProjectRolesPanelSkeleton />
      <WorkingCalendarSkeleton />

      <section className="rounded-xl border border-red-200 bg-red-50/50 p-6">
        <Skeleton className="h-5 w-28 bg-red-100" />
        <SkeletonSoft className="mt-2 h-3.5 w-80 max-w-full bg-red-100/70" />
        <Skeleton className="mt-4 h-9 w-32 rounded-lg bg-red-200/80" />
      </section>
    </div>
  );
}

export function RolesBuilderSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-gray-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <SkeletonSoft className="h-7 w-16 rounded-md" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((__, chip) => (
              <SkeletonSoft key={chip} className="h-7 w-20 rounded-md" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectRolesPanelSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <Skeleton className="h-5 w-36" />
        <SkeletonSoft className="mt-1.5 h-3.5 w-56" />
      </div>
      <div className="p-5">
        <RolesBuilderSkeleton />
      </div>
      <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
        <SkeletonSoft className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function WorkingCalendarSkeleton() {
  return (
    <section className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <Skeleton className="h-6 w-44" />
      <SkeletonSoft className="mt-2 h-3.5 w-72 max-w-full" />

      <div className="mt-6 space-y-6">
        <div>
          <Skeleton className="h-4 w-24" />
          <div className="mt-3 flex flex-wrap gap-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <SkeletonSoft className="h-3.5 w-12" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <Skeleton className="h-4 w-28" />
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          <div className="mt-4 max-h-40 space-y-0 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <SkeletonSoft className="h-3.5 w-40" />
                <SkeletonSoft className="h-7 w-7 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <Skeleton className="h-4 w-24" />
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
          <div className="mt-4 space-y-0 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <SkeletonSoft className="h-3.5 w-52 max-w-full" />
                <SkeletonSoft className="h-7 w-7 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
