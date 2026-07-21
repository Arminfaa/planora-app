'use client';

import { Skeleton, SkeletonSoft } from '@/shared/components/feedback/Skeleton';

interface AllTasksSkeletonProps {
  /** board: back link + board title; project: project eyebrow */
  scope?: 'board' | 'project';
}

export function AllTasksSkeleton({ scope = 'project' }: AllTasksSkeletonProps) {
  return (
    <div
      className="mx-auto w-full max-w-5xl animate-pulse px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="space-y-5">
        {scope === 'board' ? (
          <SkeletonSoft className="h-4 w-28" />
        ) : (
          <SkeletonSoft className="h-3.5 w-36" />
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-8 w-52 max-w-full sm:h-9 sm:w-64" />
            <div className="mt-3 flex flex-wrap gap-2">
              <SkeletonSoft className="h-7 w-24 rounded-full" />
              <SkeletonSoft className="h-7 w-28 rounded-full" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full flex-1 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
          <SkeletonSoft className="h-10 w-20 rounded-xl" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <TaskCardSkeleton key={index} showBoardPill={scope === 'project'} />
        ))}
      </div>
    </div>
  );
}

function TaskCardSkeleton({ showBoardPill }: { showBoardPill?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {showBoardPill ? (
            <SkeletonSoft className="h-5 w-16 rounded-full" />
          ) : null}
          <SkeletonSoft className="h-5 w-14 rounded-full" />
          <SkeletonSoft className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex gap-1.5">
          <SkeletonSoft className="h-8 w-8 rounded-lg" />
          <SkeletonSoft className="h-8 w-8 rounded-lg" />
        </div>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 max-w-[20rem]" />
          <SkeletonSoft className="h-3.5 w-full" />
          <SkeletonSoft className="h-3.5 w-2/3" />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <SkeletonSoft className="h-5 w-14 rounded-full" />
            <SkeletonSoft className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <SkeletonCircleSoft />
            <SkeletonSoft className="h-3.5 w-20" />
            <SkeletonSoft className="h-3.5 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCircleSoft() {
  return (
    <div aria-hidden className="h-6 w-6 shrink-0 rounded-full bg-gray-200/80" />
  );
}
