import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Reset password');

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
