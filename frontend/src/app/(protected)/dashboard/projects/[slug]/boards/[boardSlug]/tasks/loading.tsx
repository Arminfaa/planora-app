'use client';

import { AllTasksSkeleton } from '@/features/board/components/AllTasksSkeleton';

export default function BoardTasksLoading() {
  return <AllTasksSkeleton scope="board" />;
}
