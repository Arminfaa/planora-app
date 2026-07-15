import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Sign in');

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
