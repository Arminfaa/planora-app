import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Register',
};

export default function RegisterPage() {
  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Create Account
      </h2>
      <RegisterForm />
    </div>
  );
}
