'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectContext } from '../context/ProjectContext';

type ProjectNavKey = 'overview' | 'group' | 'team' | 'settings';

function getActiveKey(pathname: string, slug: string): ProjectNavKey {
  const base = `/dashboard/projects/${slug}`;
  if (pathname === base || pathname === `${base}/`) return 'overview';
  if (pathname.startsWith(`${base}/group`)) return 'group';
  if (pathname.startsWith(`${base}/team`)) return 'team';
  if (pathname.startsWith(`${base}/settings`)) return 'settings';
  return 'overview';
}

export function ProjectSubNav() {
  const pathname = usePathname();
  const { project, slug } = useProjectContext();
  const { can } = useProjectPermissions(project);

  const base = `/dashboard/projects/${slug}`;
  const activeKey = getActiveKey(pathname, slug);

  const items = [
    { key: 'overview' as const, label: 'Overview', href: base, visible: true },
    {
      key: 'group' as const,
      label: 'Group',
      href: `${base}/group`,
      visible: can('group.view'),
    },
    {
      key: 'team' as const,
      label: 'Team',
      href: `${base}/team`,
      visible: can('team.view'),
    },
    {
      key: 'settings' as const,
      label: 'Settings',
      href: `${base}/settings`,
      visible:
        can('project.edit') ||
        can('project.delete') ||
        (project.permissionMode === 'CUSTOM' && can('role.manage')),
    },
  ].filter((item) => item.visible);

  return (
    <nav
      className="flex flex-wrap gap-1 rounded-xl border border-gray-200/80 bg-gray-100/80 p-1 backdrop-blur-sm"
      aria-label="Project sections"
    >
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
