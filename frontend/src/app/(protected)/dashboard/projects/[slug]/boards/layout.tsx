import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Board');

export default function BoardsSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
