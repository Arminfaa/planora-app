'use client';

import { PageContainer } from '@/shared/components/layout/PageContainer';
import {
  Skeleton,
  SkeletonCircle,
  SkeletonSoft,
} from '@/shared/components/feedback/Skeleton';

export function ProfileSkeleton() {
  return (
    <PageContainer>
      <div
        className="mx-auto max-w-2xl animate-pulse space-y-8"
        aria-busy="true"
        aria-live="polite"
      >
        <div>
          <Skeleton className="h-8 w-40" />
          <SkeletonSoft className="mt-2 h-4 w-64 max-w-full" />
        </div>

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <SkeletonCircle className="h-20 w-20 bg-indigo-100/80" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-28 rounded-lg bg-white/80" />
                <SkeletonSoft className="h-9 w-24 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="space-y-5 px-6 py-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonSoft className="h-3.5 w-16" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
            <div className="space-y-2">
              <SkeletonSoft className="h-3.5 w-14" />
              <Skeleton className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
            <div className="rounded-lg bg-gray-50 px-4 py-3">
              <SkeletonSoft className="h-3.5 w-48" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <SkeletonSoft className="mt-2 h-3.5 w-64 max-w-full" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <SkeletonSoft className="h-3.5 w-28" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="mt-2 h-10 w-36 rounded-lg" />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
