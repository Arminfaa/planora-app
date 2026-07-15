import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Profile');

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
