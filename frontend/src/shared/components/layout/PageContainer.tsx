import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto max-w-7xl px-4 py-8 sm:px-6', className)}>
      {children}
    </div>
  );
}
