import { GuestGuard } from '@/features/auth/components/GuestGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Project Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your projects and teams
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
