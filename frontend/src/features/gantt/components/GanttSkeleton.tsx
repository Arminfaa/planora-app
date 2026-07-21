'use client';

import { Skeleton, SkeletonSoft } from '@/shared/components/feedback/Skeleton';

export function GanttSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div>
        <Skeleton className="h-6 w-40" />
        <SkeletonSoft className="mt-2 h-3.5 w-72 max-w-full" />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-16 rounded-lg" />
            ))}
          </div>
          <SkeletonSoft className="h-4 w-32" />
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[48rem]">
            <div className="grid grid-cols-[16rem_1fr] border-b border-gray-100 bg-gray-50 px-3 py-2">
              <SkeletonSoft className="h-3.5 w-20" />
              <div className="flex gap-6 ps-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonSoft key={index} className="h-3.5 w-10" />
                ))}
              </div>
            </div>

            <div className="max-h-[70vh]">
              {Array.from({ length: 8 }).map((_, row) => (
                <div
                  key={row}
                  className={`grid grid-cols-[16rem_1fr] border-b border-gray-50 ${
                    row % 3 === 0 ? 'bg-gray-50/70' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-3">
                    {row % 3 === 0 ? (
                      <Skeleton className="h-4 w-28" />
                    ) : (
                      <>
                        <SkeletonSoft className="h-3.5 w-3.5 rounded" />
                        <SkeletonSoft className="h-3.5 w-36" />
                      </>
                    )}
                  </div>
                  <div className="relative flex items-center px-3 py-3">
                    {row % 3 !== 0 ? (
                      <div
                        className="h-6 rounded-md bg-indigo-100/80"
                        style={{
                          width: `${28 + ((row * 13) % 40)}%`,
                          marginInlineStart: `${8 + ((row * 11) % 35)}%`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              <SkeletonSoft className="h-3.5 w-64 max-w-full" />
              <SkeletonSoft className="h-7 w-7 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
