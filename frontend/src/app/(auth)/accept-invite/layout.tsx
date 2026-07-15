import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Accept invite');

export default function AcceptInviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
