'use client';

import { PageContainer } from '@/shared/components/layout/PageContainer';
import { Skeleton, SkeletonSoft } from '@/shared/components/feedback/Skeleton';

export function NotificationsSkeleton() {
  return (
    <PageContainer>
      <div
        className="mx-auto max-w-3xl animate-pulse space-y-6"
        aria-busy="true"
        aria-live="polite"
      >
        <div>
          <Skeleton className="h-8 w-48" />
          <SkeletonSoft className="mt-2 h-4 w-72 max-w-full" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SkeletonSoft className="h-4 w-40" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <Skeleton className="h-4 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <SkeletonSoft className="h-4 w-36" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <NotificationsListSkeleton />
      </div>
    </PageContainer>
  );
}

export function NotificationsListSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 max-w-[16rem]" />
              <SkeletonSoft className="h-3.5 w-full" />
              <SkeletonSoft className="h-3.5 w-2/3" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <SkeletonSoft className="h-3 w-14" />
              {index < 2 ? (
                <Skeleton className="h-5 w-14 rounded-full bg-primary-100" />
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
