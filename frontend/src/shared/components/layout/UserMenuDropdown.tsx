'use client';

import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface UserMenuDropdownProps {
  className?: string;
  greeting?: boolean;
}

export function UserMenuDropdown({
  className = '',
  greeting = true,
}: UserMenuDropdownProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const displayName = user.name.split(' ')[0] || user.name;

  const items: MenuProps['items'] = [
    { key: 'profile', label: 'Profile' },
    { type: 'divider' },
    { key: 'signout', label: 'Sign out', danger: true },
  ];

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile') {
      router.push('/dashboard/profile');
      return;
    }
    if (key === 'signout') {
      logout();
    }
  };

  return (
    <Dropdown
      menu={{ items, onClick }}
      trigger={['click']}
      placement="bottomRight"
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 ${className}`}
      >
        {greeting ? `Hi, ${displayName}` : user.name}
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </Dropdown>
  );
}
