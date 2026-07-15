import { DashboardView } from '@/features/dashboard/components/DashboardView';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Dashboard');

export default function DashboardPage() {
  return <DashboardView />;
}
