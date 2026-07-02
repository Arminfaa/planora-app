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
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </AuthGuard>
  );
}
