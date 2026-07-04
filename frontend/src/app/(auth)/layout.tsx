import { GuestGuard } from '@/features/auth/components/GuestGuard';
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <AuthPageLayout>{children}</AuthPageLayout>
    </GuestGuard>
  );
}
