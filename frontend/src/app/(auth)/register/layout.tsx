import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Sign up');

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
