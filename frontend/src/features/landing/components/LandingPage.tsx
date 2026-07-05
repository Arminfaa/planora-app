'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useHasMounted } from '@/shared/hooks/useHasMounted';
import { LandingNavbar } from './LandingNavbar';
import { AppLogo } from '@/shared/components/ui/AppLogo';

const highlights = [
  'Project group',
  'Custom roles',
  'All tasks view',
  'Live collaboration',
];

const features = [
  {
    title: 'Project group',
    description:
      'Chat with your team in a thread built for work — message bubbles, avatars, file uploads, and a live activity feed for every task change.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    ),
    accent: 'from-indigo-500/15 to-indigo-600/5 text-indigo-600',
    badge: 'New',
    span: 'lg:col-span-2 lg:row-span-2',
    featured: true,
    preview: 'group-chat' as const,
  },
  {
    title: 'Smart notifications',
    description:
      'In-app alerts and browser push for task moves, assignments, and group messages — with deep links straight to the work.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    ),
    accent: 'from-orange-500/15 to-amber-600/5 text-orange-600',
    badge: 'New',
    span: 'lg:col-span-2 lg:row-span-2',
    featured: true,
    preview: 'notifications' as const,
  },
  {
    title: 'Custom roles & permissions',
    description:
      'Define owner, admin, and member defaults — or build custom roles with granular control over boards, tasks, team, and settings.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
    accent: 'from-violet-500/15 to-violet-600/5 text-violet-600',
    badge: 'New',
    span: 'lg:col-span-2 lg:row-span-1',
    featured: false,
  },
  {
    title: 'Kanban boards',
    description:
      'Drag tasks between columns, reorder work, and customize board backgrounds for a workspace that feels yours.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
      />
    ),
    accent: 'from-blue-500/15 to-blue-600/5 text-blue-600',
    span: 'lg:row-span-1',
    featured: false,
  },
  {
    title: 'All tasks view',
    description:
      'See every task across columns in one searchable list — filter, sort, and create work without leaving the board.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 6h16M4 10h16M4 14h16M4 18h16"
      />
    ),
    accent: 'from-cyan-500/15 to-cyan-600/5 text-cyan-600',
    badge: 'New',
    span: 'lg:row-span-1',
    featured: false,
  },
  {
    title: 'Rich task cards',
    description:
      'Labels, checklists, comments, attachments, priorities, due dates, and assignees — everything on one card.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
    accent: 'from-rose-500/15 to-rose-600/5 text-rose-600',
    span: 'lg:row-span-1',
    featured: false,
  },
  {
    title: 'Real-time sync',
    description:
      'Boards and group chat update instantly when teammates move tasks, post messages, or edit project settings.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
    accent: 'from-emerald-500/15 to-emerald-600/5 text-emerald-600',
    span: 'lg:row-span-1',
    featured: false,
  },
  {
    title: 'Search & filters',
    description:
      'Global project search plus board-level filters by priority, assignee, labels, and due dates.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    ),
    accent: 'from-amber-500/15 to-amber-600/5 text-amber-600',
    span: 'lg:row-span-1',
    featured: false,
  },
  {
    title: 'Team invites',
    description:
      'Invite by email with role assignment — existing users join instantly, new users get a secure invite link.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    ),
    accent: 'from-fuchsia-500/15 to-fuchsia-600/5 text-fuchsia-600',
    span: 'lg:row-span-1',
    featured: false,
  },
];

const steps = [
  {
    step: '01',
    title: 'Create a project',
    description:
      'Name your workspace, pick default or custom roles, and invite your team in one flow.',
  },
  {
    step: '02',
    title: 'Build boards & chat',
    description:
      'Set up Kanban columns, open the project group, and start coordinating in real time.',
  },
  {
    step: '03',
    title: 'Ship together',
    description:
      'Track tasks in board or list view, share files, and stay aligned from first idea to done.',
  },
];

const stats = [
  { value: 'Kanban', label: 'Drag-and-drop boards' },
  { value: 'Live', label: 'Real-time updates' },
  { value: 'Roles', label: 'Granular permissions' },
  { value: 'Group', label: 'Project group' },
];

function KanbanPreview() {
  const columns = [
    {
      name: 'To Do',
      color: '#6B7280',
      tasks: [
        { title: 'Design landing', labels: ['Design'] },
        { title: 'API review', labels: ['Backend'] },
      ],
    },
    {
      name: 'In Progress',
      color: '#3B82F6',
      tasks: [{ title: 'Board UI', labels: ['Frontend'], checklist: '2/4' }],
    },
    {
      name: 'Done',
      color: '#10B981',
      tasks: [
        { title: 'Auth flow', labels: ['Done'] },
        { title: 'Custom roles', labels: ['New'] },
      ],
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 shadow-xl backdrop-blur-sm">
      <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Sprint board
            </p>
            <p className="text-sm font-semibold text-gray-900">
              Product launch
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-hidden p-3">
        {columns.map((col) => (
          <div
            key={col.name}
            className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-50/60 p-2"
          >
            <div
              className="mb-2 border-t-2 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600"
              style={{ borderColor: col.color }}
            >
              {col.name}
            </div>
            <div className="space-y-1.5">
              {col.tasks.map((task) => (
                <div
                  key={task.title}
                  className="rounded-lg border border-gray-200/80 bg-white px-2 py-1.5 shadow-sm"
                >
                  <p className="text-[11px] font-medium text-gray-800">
                    {task.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {task.labels.map((label) => (
                      <span
                        key={label}
                        className="rounded px-1 py-0.5 text-[9px] font-medium text-primary-700 bg-primary-50"
                      >
                        {label}
                      </span>
                    ))}
                    {'checklist' in task && task.checklist && (
                      <span className="text-[9px] text-gray-400">
                        ✓ {task.checklist}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewAvatar({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-[10px] font-semibold text-white ${className}`}
    >
      {initials}
    </span>
  );
}

function GroupChatPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl backdrop-blur-sm ${compact ? 'shadow-md' : ''}`}
    >
      <div
        className={`border-b border-gray-100 bg-white ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Project group
            </p>
            <p
              className={`font-semibold text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}
            >
              Product launch
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
      </div>

      <div
        className={`space-y-1 bg-gray-50/40 ${compact ? 'px-2 py-0.5' : 'px-3 py-1'}`}
      >
        <div className="py-1 text-center">
          <span className="text-[10px] font-medium text-gray-400">Today</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 py-1">
          <div className="max-w-[90%] rounded-full bg-gray-100 px-3 py-1.5 text-center">
            <p className="text-[10px] leading-relaxed text-gray-600">
              Sarah moved <span className="font-medium">Board UI</span> to In
              Progress
            </p>
          </div>
        </div>

        <div className="flex w-full justify-start py-0.5">
          <div className="flex max-w-[85%] gap-2">
            <div className="flex shrink-0 items-end pb-4">
              <PreviewAvatar
                name="Alex Chen"
                className={compact ? 'h-6 w-6 text-[9px]' : ''}
              />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 px-1 text-[10px] font-medium text-gray-400">
                Alex Chen
              </p>
              <div className="relative rounded-2xl bg-gray-100 px-3 py-2 pb-5">
                <p className="pe-8 text-[11px] leading-relaxed text-gray-900">
                  Uploaded the wireframes — take a look!
                </p>
                <span className="absolute bottom-1.5 end-2.5 text-[9px] text-gray-400">
                  10:24
                </span>
              </div>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="flex w-full justify-end py-0.5">
            <div className="flex max-w-[85%] flex-row-reverse gap-2">
              <div className="flex shrink-0 items-end pb-4">
                <PreviewAvatar name="You" />
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 px-1 text-end text-[10px] font-medium text-gray-400">
                  You
                </p>
                <div className="relative rounded-2xl bg-primary-100 px-3 py-2 pb-5">
                  <p className="pe-8 text-[11px] leading-relaxed text-gray-900">
                    Looks great. I&apos;ll review after standup.
                  </p>
                  <span className="absolute bottom-1.5 end-2.5 text-[9px] text-gray-400">
                    10:31
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        className={`border-t border-gray-100 bg-white ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}
      >
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-[11px] text-gray-400">Write a message...</span>
        </div>
      </div>
    </div>
  );
}

function HeroNotificationPanel() {
  const items = [
    {
      title: 'Task moved',
      body: 'Board UI → In Progress',
      time: 'now',
      accent: 'bg-blue-100 text-blue-600',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 7l5 5m0 0l-5 5m5-5H6"
        />
      ),
    },
    {
      title: 'New message',
      body: 'Alex uploaded wireframes',
      time: '2m',
      accent: 'bg-indigo-100 text-indigo-600',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-orange-200/70 bg-white/95 shadow-xl shadow-orange-500/10 ring-1 ring-black/[0.04] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 border-b border-orange-100/80 bg-gradient-to-r from-orange-50 to-amber-50/80 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-sm">
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white ring-2 ring-white">
              3
            </span>
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
              Notifications
            </p>
            <p className="text-[11px] font-semibold leading-tight text-gray-900">
              3 unread
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/80 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-orange-700 ring-1 ring-orange-200">
          Live
        </span>
      </div>

      <div className="divide-y divide-orange-100/60">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-2 px-2.5 py-1.5"
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${item.accent}`}
            >
              <svg
                className="h-2.5 w-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {item.icon}
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold text-gray-900">
                {item.title}
                <span className="font-normal text-gray-500">
                  {' '}
                  · {item.body}
                </span>
              </p>
            </div>
            <span className="shrink-0 text-[8px] text-gray-400">
              {item.time}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-primary-400/20 via-violet-400/15 to-indigo-400/20 blur-3xl" />
      <div className="relative grid gap-4 lg:grid-cols-5 lg:gap-5 lg:items-center">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="landing-hero-card landing-hero-card-a">
            <KanbanPreview />
          </div>
          <div className="landing-hero-card landing-hero-card-b">
            <HeroNotificationPanel />
          </div>
        </div>
        <div className="landing-hero-card landing-hero-card-c lg:col-span-2">
          <GroupChatPreview />
        </div>
      </div>
    </div>
  );
}

function FeaturePreviewPanel({
  preview,
}: {
  preview: 'group-chat' | 'notifications';
}) {
  if (preview === 'group-chat') {
    return <GroupChatPreview compact />;
  }
  return <HeroNotificationPanel />;
}

function FeatureIcon({ icon, accent }: { icon: ReactNode; accent: string }) {
  return (
    <div
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {icon}
      </svg>
    </div>
  );
}

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const hasMounted = useHasMounted();
  const authed = hasMounted && !isLoading && isAuthenticated;

  const primaryHref = authed ? '/dashboard' : '/register';
  const primaryLabel = authed ? 'Go to Dashboard' : 'Get Started Free';
  const secondaryHref = authed ? '#features' : '/login';
  const secondaryLabel = authed ? 'See features' : 'Sign In';

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-indigo-100/60">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(99,102,241,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_90%,rgba(139,92,246,0.12),transparent_50%)]" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/20 blur-3xl landing-float" />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pb-12 sm:pt-10 lg:pb-16 lg:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full border border-primary-200/50 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-primary-700 shadow-sm backdrop-blur-sm"
                >
                  {item}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Plan, chat, and ship —{' '}
              <span className="bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
                all in one workspace
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
              Kanban boards, Project group with chat bubbles and activity logs,
              custom roles, and granular permissions — built for teams that move
              fast and stay aligned.
            </p>

            <div className="mt-8 flex min-h-[52px] flex-wrap items-center justify-center gap-3">
              <Link
                href={primaryHref}
                className="rounded-xl bg-primary-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/30"
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="rounded-xl border border-gray-200/80 bg-white/80 px-7 py-3.5 text-sm font-semibold text-gray-700 shadow-sm backdrop-blur-sm transition hover:border-gray-300 hover:bg-white"
              >
                {secondaryLabel}
              </Link>
            </div>
          </div>

          <div className="mt-14 sm:mt-16 lg:mt-20">
            <ProductPreview />
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-gray-900 sm:text-xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — bento grid */}
      <section
        id="features"
        className="border-b border-gray-100 bg-white py-10 sm:py-14"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              Features
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything your team needs
            </h2>
            <p className="mt-3 text-gray-600">
              From boards and tasks to chat, notifications, roles, and
              permissions — one platform that grows with your projects.
            </p>
          </div>

          <div className="mt-12 grid auto-rows-auto gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
            {features.map((feature) => {
              const hasPreview = 'preview' in feature && feature.preview;
              const isNotifications =
                hasPreview && feature.preview === 'notifications';

              return (
                <div
                  key={feature.title}
                  className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-lg h-full ${feature.span}`}
                >
                  {feature.featured && (
                    <div
                      className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition ${
                        isNotifications
                          ? 'bg-gradient-to-br from-orange-100/80 to-amber-100/40 group-hover:from-orange-200/80'
                          : 'bg-gradient-to-br from-indigo-100/80 to-violet-100/40 group-hover:from-indigo-200/80'
                      }`}
                    />
                  )}
                  <div
                    className={`relative ${hasPreview ? 'flex h-full flex-col gap-4 lg:flex-row lg:items-center' : ''}`}
                  >
                    <div className={hasPreview ? 'shrink-0 lg:w-[42%]' : ''}>
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <FeatureIcon
                          icon={feature.icon}
                          accent={feature.accent}
                        />
                        {'badge' in feature && feature.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              isNotifications
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {feature.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                    {hasPreview && feature.preview && (
                      <div className="min-w-0 flex-1">
                        <FeaturePreviewPanel preview={feature.preview} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white py-10 sm:py-14"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="mt-3 text-gray-600">
              No complex setup. Create a project, configure roles, and start
              collaborating.
            </p>
          </div>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-transparent via-primary-200 to-transparent md:block" />
            {steps.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm md:text-left"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-sm font-bold text-primary-600">
                  {item.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary-600 to-violet-700 py-10 sm:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {authed
              ? 'Your workspace is ready'
              : 'Ready to organize your next project?'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-100">
            {authed
              ? 'Jump back into your boards, group chat, and team settings.'
              : 'Join free — set up projects, invite your team, and start shipping today.'}
          </p>
          <Link
            href={authed ? '/dashboard' : '/register'}
            className="mt-8 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-primary-700 shadow-xl transition hover:bg-indigo-50 hover:shadow-2xl"
          >
            {authed ? 'Open Dashboard' : 'Create free account'}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <AppLogo size="xs" className="rounded-md" />
            <p className="text-sm text-gray-500">
              © All rights reserved for{' '}
              <a
                href="https://arminfatehi.ir/en"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-700 transition hover:text-primary-600"
              >
                Armin Fatehi
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="#features"
              className="text-gray-500 transition hover:text-gray-900"
            >
              Features
            </Link>
            {!authed && (
              <>
                <Link
                  href="/login"
                  className="text-gray-500 transition hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-gray-500 transition hover:text-gray-900"
                >
                  Register
                </Link>
              </>
            )}
            {authed && (
              <Link
                href="/dashboard"
                className="text-gray-500 transition hover:text-gray-900"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
