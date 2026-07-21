import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/** Static bone — put `animate-pulse` on a parent wrapper once. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('rounded-md bg-gray-200/80', className)}
    />
  );
}

export function SkeletonSoft({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn('rounded-md bg-gray-100', className)}
    />
  );
}

export function SkeletonLine({
  className,
  width = 'w-full',
}: SkeletonProps & { width?: string }) {
  return <Skeleton className={cn('h-3.5', width, className)} />;
}

export function SkeletonCircle({ className }: SkeletonProps) {
  return <Skeleton className={cn('rounded-full', className)} />;
}
