import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Tasks');

export default function ProjectTasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
