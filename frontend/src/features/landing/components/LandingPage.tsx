'use client';

import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LandingNavbar } from './LandingNavbar';

const features = [
  {
    title: 'Kanban boards',
    description:
      'Organize work in columns, drag tasks between stages, and reorder everything intuitively.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
      />
    ),
    accent: 'from-blue-500/10 to-blue-600/5 text-blue-600',
  },
  {
    title: 'Real-time sync',
    description:
      'See live updates when teammates move tasks, edit boards, or add new work.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
    accent: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600',
  },
  {
    title: 'Team & roles',
    description:
      'Invite members by email, assign owner/admin/member roles, and manage access.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    ),
    accent: 'from-violet-500/10 to-violet-600/5 text-violet-600',
  },
  {
    title: 'Search & filters',
    description:
      'Find tasks instantly with board search, priority filters, assignee, and due dates.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    ),
    accent: 'from-amber-500/10 to-amber-600/5 text-amber-600',
  },
  {
    title: 'Rich tasks',
    description:
      'Labels, comments, attachments, priorities, due dates, and assignees on every card.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
    accent: 'from-rose-500/10 to-rose-600/5 text-rose-600',
  },
  {
    title: 'Custom boards',
    description:
      'Personalize boards with custom backgrounds and a polished full-width workspace.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
    accent: 'from-cyan-500/10 to-cyan-600/5 text-cyan-600',
  },
];

const steps = [
  {
    step: '01',
    title: 'Create a project',
    description: 'Set up a workspace with a name and description in seconds.',
  },
  {
    step: '02',
    title: 'Build your boards',
    description: 'Add Kanban boards, invite your team, and configure columns.',
  },
  {
    step: '03',
    title: 'Ship together',
    description: 'Track tasks, collaborate live, and keep everyone aligned.',
  },
];

function KanbanPreview() {
  const columns = [
    {
      name: 'To Do',
      color: '#6B7280',
      tasks: ['Design landing', 'API review'],
    },
    { name: 'In Progress', color: '#3B82F6', tasks: ['Board UI'] },
    { name: 'Done', color: '#10B981', tasks: ['Auth flow', 'Project setup'] },
  ];

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-500/20 to-violet-500/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 p-4 shadow-2xl backdrop-blur-sm sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Sprint board
            </p>
            <p className="text-sm font-semibold text-gray-900">
              Product launch
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {columns.map((col) => (
            <div
              key={col.name}
              className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-gray-50/80 p-2.5"
            >
              <div
                className="mb-2 border-t-2 pt-2 text-xs font-medium text-gray-700"
                style={{ borderColor: col.color }}
              >
                {col.name}
              </div>
              <div className="space-y-2">
                {col.tasks.map((task) => (
                  <div
                    key={task}
                    className="rounded-lg border border-gray-200/80 bg-white px-2.5 py-2 text-xs text-gray-800 shadow-sm"
                  >
                    {task}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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
      <section className="relative overflow-hidden border-b border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(99,102,241,0.15),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_80%,rgba(139,92,246,0.1),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:pb-28">
          <div className="mx-auto max-w-full text-center">
            <p className="mb-4 inline-flex rounded-full border border-primary-200/60 bg-primary-50/80 px-3 py-1 text-xs font-medium text-primary-700">
              Kanban · Real-time · Teams
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Ship projects with clarity and speed
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">
              A modern workspace for teams to plan, track, and deliver work —
              with Kanban boards, live collaboration, and everything your
              projects need in one place.
            </p>

            {!isLoading && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={primaryHref}
                  className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
                >
                  {primaryLabel}
                </Link>
                <Link
                  href={secondaryHref}
                  className="rounded-xl border border-gray-200 bg-white/80 px-6 py-3 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white"
                >
                  {secondaryLabel}
                </Link>
              </div>
            )}
          </div>

          <div className="mt-14 sm:mt-16">
            <KanbanPreview />
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-b border-gray-100 bg-white py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Everything you need to run projects
            </h2>
            <p className="mt-3 text-gray-600">
              From first idea to done — boards, tasks, and team tools built for
              how you actually work.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-gray-200 hover:shadow-md"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent}`}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Up and running in minutes
            </h2>
            <p className="mt-3 text-gray-600">
              No complex setup. Create a project, invite your team, start moving
              tasks.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="relative text-center md:text-left"
              >
                <span className="text-4xl font-bold text-primary-100">
                  {item.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary-600 to-violet-600 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {isAuthenticated
              ? 'Your workspace is ready'
              : 'Ready to organize your next project?'}
          </h2>
          <p className="mt-4 text-indigo-100">
            {isAuthenticated
              ? 'Jump back into your projects and keep your team in sync.'
              : 'Join free and start building boards with your team today.'}
          </p>
          {!isLoading && (
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary-700 shadow-lg transition hover:bg-indigo-50"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Create free account'}
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()}{' '}
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Project Management'}
          </p>
          <div className="flex gap-4 text-sm">
            {!isLoading && !isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-gray-500 hover:text-gray-900"
                >
                  Register
                </Link>
              </>
            )}
            {!isLoading && isAuthenticated && (
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-900"
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
