import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { Header } from '@/shared/components/layout/Header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>{children}</main>
      </div>
    </AuthGuard>
  );
}
