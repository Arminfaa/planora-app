'use client';

import {
  Skeleton,
  SkeletonCircle,
  SkeletonSoft,
} from '@/shared/components/feedback/Skeleton';

export function ProjectGroupSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 animate-pulse flex-col px-4 py-6 sm:px-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-gray-100 px-5 py-4">
          <Skeleton className="h-5 w-36" />
          <SkeletonSoft className="mt-1.5 h-3.5 w-56" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-hidden bg-[#fafafa] px-4 py-4 sm:px-5">
            <div className="flex justify-center">
              <SkeletonSoft className="h-5 w-24 rounded-full" />
            </div>

            <MessageBubble side="left" wide />
            <MessageBubble side="right" />
            <MessageBubble side="left" />
            <MessageBubble side="right" wide />
            <MessageBubble side="left" wide />
            <MessageBubble side="right" />
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4">
            <div className="flex flex-col items-start gap-2 sm:flex-row">
              <Skeleton className="h-16 w-full flex-1 rounded-lg" />
              <div className="flex gap-2">
                <SkeletonSoft className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GroupMessagesSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      <div className="flex justify-center">
        <SkeletonSoft className="h-5 w-24 rounded-full" />
      </div>
      <MessageBubble side="left" wide />
      <MessageBubble side="right" />
      <MessageBubble side="left" />
      <MessageBubble side="right" wide />
      <MessageBubble side="left" />
    </div>
  );
}

function MessageBubble({
  side,
  wide = false,
}: {
  side: 'left' | 'right';
  wide?: boolean;
}) {
  const isOwn = side === 'right';
  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {!isOwn ? <SkeletonCircle className="h-8 w-8 shrink-0" /> : null}
      <div
        className={`space-y-1.5 rounded-2xl px-3 py-2.5 ${
          isOwn ? 'bg-primary-100/60' : 'bg-gray-100'
        } ${wide ? 'w-[min(72vw,16rem)] sm:w-80' : 'w-[min(60vw,12rem)] sm:w-56'}`}
      >
        {!isOwn ? <SkeletonSoft className="h-3 w-16 bg-gray-200/80" /> : null}
        <Skeleton
          className={`h-3.5 ${isOwn ? 'bg-primary-200/50' : 'bg-gray-200/80'} w-full`}
        />
        <Skeleton
          className={`h-3.5 ${isOwn ? 'bg-primary-200/50' : 'bg-gray-200/80'} w-2/3`}
        />
      </div>
    </div>
  );
}
