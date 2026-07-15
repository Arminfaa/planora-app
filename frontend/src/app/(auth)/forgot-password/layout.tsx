import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Forgot password');

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
