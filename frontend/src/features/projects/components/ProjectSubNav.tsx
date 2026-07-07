'use client';

import { Segmented } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectContext } from '../context/ProjectContext';
import { useLocale } from '@/i18n/LocaleProvider';

type ProjectNavKey = 'overview' | 'gantt' | 'group' | 'team' | 'settings';

function getActiveKey(pathname: string, slug: string): ProjectNavKey {
  const base = `/dashboard/projects/${slug}`;
  if (pathname === base || pathname === `${base}/`) return 'overview';
  if (pathname.startsWith(`${base}/gantt`)) return 'gantt';
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
  const { t } = useLocale();

  const base = `/dashboard/projects/${slug}`;
  const activeKey = getActiveKey(pathname, slug);

  const items = [
    {
      key: 'overview' as const,
      label: t('projects.overview'),
      href: base,
      visible: true,
    },
    {
      key: 'gantt' as const,
      label: t('projects.gantt'),
      href: `${base}/gantt`,
      visible: can('task.view'),
    },
    {
      key: 'group' as const,
      label: t('projects.group'),
      href: `${base}/group`,
      visible: can('group.view'),
    },
    {
      key: 'team' as const,
      label: t('projects.team'),
      href: `${base}/team`,
      visible: can('team.view'),
    },
    {
      key: 'settings' as const,
      label: t('projects.settings'),
      href: `${base}/settings`,
      visible:
        can('project.edit') ||
        can('project.delete') ||
        (project.permissionMode === 'CUSTOM' && can('role.manage')),
    },
  ].filter((item) => item.visible);

  return (
    <nav aria-label={t('projects.sectionsNavAria')} className="project-sub-nav">
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
