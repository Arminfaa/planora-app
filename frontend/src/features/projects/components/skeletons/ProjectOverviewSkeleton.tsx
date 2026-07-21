'use client';

import type { ReactNode } from 'react';
import { Skeleton, SkeletonSoft } from '@/shared/components/feedback/Skeleton';

/** Matches ProjectLayoutShell header + subnav while project detail loads. */
export function ProjectShellSkeleton({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-[calc(100vh-4rem)] animate-pulse flex-col"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative shrink-0 overflow-hidden border-b border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <SkeletonSoft className="mb-4 h-4 w-36 bg-indigo-50" />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Skeleton className="h-8 w-56 max-w-full rounded-lg bg-indigo-100/80 sm:h-9 sm:w-72" />
              <SkeletonSoft className="mt-2 h-4 w-80 max-w-full bg-indigo-50" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SkeletonSoft className="h-3.5 w-20" />
                <SkeletonSoft className="h-3.5 w-16" />
                <SkeletonSoft className="h-3.5 w-14" />
                <SkeletonSoft className="h-3.5 w-28" />
              </div>
            </div>
            <Skeleton className="h-7 w-24 rounded-full bg-emerald-100/80" />
          </div>

          <div className="mt-6">
            <div className="inline-flex gap-1 rounded-lg bg-white/70 p-1 shadow-sm">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-8 w-16 rounded-md bg-gray-100 sm:w-20"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {children ?? <ProjectOverviewBodySkeleton />}
      </div>
    </div>
  );
}

export function ProjectOverviewBodySkeleton() {
  return (
    <>
      <div className="border-b border-gray-100 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-xl border border-white/60 bg-white/70 shadow-sm"
              />
            ))}
          </div>

          <div className="mt-6 min-h-[160px] rounded-xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <SkeletonCircleSoft className="h-28 w-28" />
              <div className="flex-1 space-y-3">
                <SkeletonSoft className="h-3.5 w-full" />
                <SkeletonSoft className="h-3.5 w-5/6" />
                <SkeletonSoft className="h-3.5 w-2/3" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-10 w-full rounded-xl sm:max-w-md" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Skeleton className="mb-5 h-6 w-28" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="h-1 bg-indigo-100" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4 max-w-[10rem]" />
                <SkeletonSoft className="h-3.5 w-full" />
                <SkeletonSoft className="h-3.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function ProjectOverviewSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <ProjectOverviewBodySkeleton />
    </div>
  );
}

export function ProjectProgressSkeleton() {
  return (
    <div className="min-h-[160px] animate-pulse rounded-xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SkeletonCircleSoft className="h-28 w-28" />
        <div className="flex-1 space-y-3">
          <SkeletonSoft className="h-3.5 w-full" />
          <SkeletonSoft className="h-3.5 w-5/6" />
          <SkeletonSoft className="h-3.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function ProjectBoardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="h-1 bg-indigo-100" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4 max-w-[10rem]" />
            <SkeletonSoft className="h-3.5 w-full" />
            <SkeletonSoft className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCircleSoft({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`shrink-0 rounded-full bg-indigo-100/70 ${className ?? ''}`}
    />
  );
}
