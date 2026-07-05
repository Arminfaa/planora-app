'use client';

import { Dropdown, Badge } from 'antd';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

interface UserMenuDropdownProps {
  className?: string;
  greeting?: boolean;
}

export function UserMenuDropdown({
  className = '',
  greeting = true,
}: UserMenuDropdownProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();

  if (!user) return null;

  const displayName = user.name.split(' ')[0] || user.name;

  const items: MenuProps['items'] = [
    { key: 'profile', label: 'Profile' },
    {
      key: 'notifications',
      label: (
        <span className="flex w-full items-center justify-between gap-3">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge
              count={unreadCount > 99 ? '99+' : unreadCount}
              size="small"
              color="#4f46e5"
            />
          )}
        </span>
      ),
    },
    { type: 'divider' },
    { key: 'signout', label: 'Sign out', danger: true },
  ];

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'profile') {
      router.push('/dashboard/profile');
      return;
    }
    if (key === 'notifications') {
      router.push('/dashboard/notifications');
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
        {unreadCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
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
