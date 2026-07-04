'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LandingNavbar } from './LandingNavbar';

const highlights = [
  'Project group chat',
  'Custom roles',
  'All tasks view',
  'Live collaboration',
];

const features = [
  {
    title: 'Project group chat',
    description:
      'Keep the whole team aligned with real-time messaging, file uploads, and an automatic activity feed for every task change.',
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
    span: 'lg:col-span-2',
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
    span: '',
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
    span: '',
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
    span: '',
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
    span: '',
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
    span: '',
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
    span: '',
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
  { value: 'Chat', label: 'Team + activity feed' },
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

function GroupChatPreview() {
  const messages = [
    {
      type: 'activity' as const,
      text: 'Sarah moved "Board UI" to In Progress',
      time: '2m ago',
    },
    {
      type: 'user' as const,
      author: 'Alex',
      text: 'Uploaded the wireframes — take a look!',
      time: '5m ago',
      own: false,
    },
    {
      type: 'user' as const,
      author: 'You',
      text: "Looks great. I'll review after standup.",
      time: 'Just now',
      own: true,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-200/60 bg-white/90 shadow-xl backdrop-blur-sm">
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">
              Project group
            </p>
            <p className="text-sm font-semibold text-gray-900">
              Product launch
            </p>
          </div>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
            4 online
          </span>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {messages.map((msg, i) =>
          msg.type === 'activity' ? (
            <div
              key={i}
              className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2"
            >
              <p className="text-[11px] text-gray-700">{msg.text}</p>
              <p className="mt-0.5 text-[9px] text-gray-400">{msg.time}</p>
            </div>
          ) : (
            <div
              key={i}
              className={`rounded-lg border px-3 py-2 ${
                msg.own
                  ? 'ml-6 border-primary-200 bg-primary-50/70'
                  : 'mr-6 border-gray-200 bg-white'
              }`}
            >
              {!msg.own && (
                <p className="text-[9px] font-medium text-gray-500">
                  {msg.author}
                </p>
              )}
              <p className="text-[11px] text-gray-800">{msg.text}</p>
              <p className="mt-0.5 text-[9px] text-gray-400">{msg.time}</p>
            </div>
          ),
        )}
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span className="flex-1 text-[11px] text-gray-400">
            Message the team…
          </span>
          <span className="rounded-md bg-primary-600 px-2 py-0.5 text-[9px] font-medium text-white">
            Send
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative mx-auto max-w-5xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-primary-400/20 via-violet-400/15 to-indigo-400/20 blur-3xl" />
      <div className="relative grid gap-4 lg:grid-cols-5 lg:gap-5">
        <div className="lg:col-span-3 lg:translate-y-2">
          <KanbanPreview />
        </div>
        <div className="lg:col-span-2 lg:-translate-y-2">
          <GroupChatPreview />
        </div>
      </div>
    </div>
  );
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

  const primaryHref = isAuthenticated ? '/dashboard' : '/register';
  const primaryLabel = isAuthenticated ? 'Go to Dashboard' : 'Get Started Free';
  const secondaryHref = isAuthenticated ? '#features' : '/login';
  const secondaryLabel = isAuthenticated ? 'See features' : 'Sign In';

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-indigo-100/60">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(99,102,241,0.18),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_90%,rgba(139,92,246,0.12),transparent_50%)]" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-200/20 blur-3xl landing-float" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pb-28 lg:pt-20">
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
              Kanban boards, project group chat with file uploads, custom roles,
              and granular permissions — built for teams that move fast and stay
              aligned.
            </p>

            {!isLoading && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
            )}
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
        className="border-b border-gray-100 bg-white py-16 sm:py-24"
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
              From boards and tasks to chat, roles, and permissions — one
              platform that grows with your projects.
            </p>
          </div>

          <div className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200 hover:shadow-lg ${feature.span}`}
              >
                {feature.featured && (
                  <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-100/80 to-violet-100/40 blur-2xl transition group-hover:from-indigo-200/80" />
                )}
                <div className="relative">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <FeatureIcon icon={feature.icon} accent={feature.accent} />
                    {'badge' in feature && feature.badge && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                        {feature.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed text-gray-600 ${feature.featured ? 'lg:text-base' : ''}`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24"
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
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary-600 to-violet-700 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {isAuthenticated
              ? 'Your workspace is ready'
              : 'Ready to organize your next project?'}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-100">
            {isAuthenticated
              ? 'Jump back into your boards, group chat, and team settings.'
              : 'Join free — set up projects, invite your team, and start shipping today.'}
          </p>
          {!isLoading && (
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="mt-8 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-primary-700 shadow-xl transition hover:bg-indigo-50 hover:shadow-2xl"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Create free account'}
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-primary-500 to-violet-600 text-xs font-bold text-white">
              P
            </span>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()}{' '}
              {process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              href="#features"
              className="text-gray-500 transition hover:text-gray-900"
            >
              Features
            </Link>
            {!isLoading && !isAuthenticated && (
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
            {!isLoading && isAuthenticated && (
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
