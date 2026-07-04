'use client';

import { Segmented } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
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
  const router = useRouter();
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
    <nav aria-label="Project sections" className="project-sub-nav">
      <Segmented
        value={activeKey}
        onChange={(value) => {
          if (value === activeKey) return;
          const item = items.find((entry) => entry.key === value);
          if (item) router.push(item.href);
        }}
        options={items.map(({ key, label }) => ({
          label,
          value: key,
        }))}
      />
    </nav>
  );
}
