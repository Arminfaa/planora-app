import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Board tasks');

export default function BoardTasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
