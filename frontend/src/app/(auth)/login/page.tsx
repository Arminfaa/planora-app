import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function LoginPage() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">Sign In</h2>
      <LoginForm />
    </div>
  );
}
