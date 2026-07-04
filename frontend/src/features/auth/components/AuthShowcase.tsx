'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { cn } from '@/lib/utils';

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-medium text-emerald-700 ring-1 ring-emerald-100">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

function MockupAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-[9px] font-semibold text-white">
      {initials}
    </span>
  );
}

function KanbanSlideMockup() {
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
      tasks: [{ title: 'Auth flow', labels: ['Done'] }],
    },
  ];

  return (
    <div className="auth-mockup-card w-full max-w-[300px]">
      <div className="auth-mockup-header flex items-center justify-between gap-2">
        <div>
          <p className="auth-mockup-label">Sprint board</p>
          <p className="auth-mockup-title">Product launch</p>
        </div>
        <LiveBadge />
      </div>
      <div className="flex gap-1.5 p-2.5">
        {columns.map((col) => (
          <div
            key={col.name}
            className="min-w-0 flex-1 rounded-lg bg-gray-50 p-1.5"
          >
            <div
              className="mb-1.5 border-t-2 pt-1 text-[8px] font-semibold uppercase text-gray-500"
              style={{ borderColor: col.color }}
            >
              {col.name}
            </div>
            {col.tasks.map((task) => (
              <div
                key={task.title}
                className="mb-1 rounded border border-gray-100 bg-white px-1.5 py-1 shadow-sm"
              >
                <p className="text-[9px] font-medium text-gray-800">
                  {task.title}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-0.5">
                  {task.labels.map((label) => (
                    <span
                      key={label}
                      className="rounded bg-primary-50 px-1 py-px text-[7px] font-medium text-primary-700"
                    >
                      {label}
                    </span>
                  ))}
                  {'checklist' in task && task.checklist && (
                    <span className="text-[7px] text-gray-400">
                      ✓ {task.checklist}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AllTasksSlideMockup() {
  const tasks = [
    {
      title: 'Board UI',
      column: 'In Progress',
      priority: 'High',
      priorityColor: 'text-red-600 bg-red-50',
      assignee: 'AC',
    },
    {
      title: 'Design landing',
      column: 'To Do',
      priority: 'Medium',
      priorityColor: 'text-amber-600 bg-amber-50',
      assignee: 'SM',
    },
    {
      title: 'Auth flow',
      column: 'Done',
      priority: 'Low',
      priorityColor: 'text-gray-600 bg-gray-100',
      assignee: 'JD',
    },
    {
      title: 'API review',
      column: 'To Do',
      priority: 'High',
      priorityColor: 'text-red-600 bg-red-50',
      assignee: 'RK',
    },
  ];

  return (
    <div className="auth-mockup-card w-full max-w-[300px]">
      <div className="auth-mockup-header">
        <p className="auth-mockup-label">Board view</p>
        <p className="auth-mockup-title">All tasks</p>
      </div>
      <div className="border-b border-gray-100 px-2.5 py-2">
        <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5">
          <svg
            className="h-3 w-3 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-[9px] text-gray-400">Search tasks...</span>
          <span className="ml-auto rounded bg-primary-100 px-1.5 py-px text-[7px] font-medium text-primary-700">
            Filter
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => (
          <div key={task.title} className="flex items-center gap-2 px-2.5 py-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-[7px] font-semibold text-white">
              {task.assignee}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[9px] font-medium text-gray-800">
                {task.title}
              </p>
              <p className="text-[7px] text-gray-400">{task.column}</p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded px-1 py-px text-[7px] font-medium',
                task.priorityColor,
              )}
            >
              {task.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatSlideMockup() {
  return (
    <div className="auth-mockup-card w-full max-w-[280px]">
      <div className="auth-mockup-header flex items-center justify-between gap-2">
        <div>
          <p className="auth-mockup-label">Project group</p>
          <p className="auth-mockup-title">Product launch</p>
        </div>
        <LiveBadge />
      </div>

      <div className="space-y-0.5 bg-gray-50/60 px-2.5 py-1.5">
        <div className="py-0.5 text-center">
          <span className="text-[8px] font-medium text-gray-400">Today</span>
        </div>

        <div className="flex flex-col items-center py-0.5">
          <div className="max-w-[92%] rounded-full bg-gray-100 px-2.5 py-1 text-center">
            <p className="text-[8px] leading-relaxed text-gray-600">
              Sarah moved <span className="font-medium">Board UI</span> to In
              Progress
            </p>
          </div>
        </div>

        <div className="flex w-full justify-start py-0.5">
          <div className="flex max-w-[88%] gap-1.5">
            <div className="flex shrink-0 items-end pb-3">
              <MockupAvatar name="Alex Chen" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 px-0.5 text-[8px] font-medium text-gray-400">
                Alex Chen
              </p>
              <div className="relative rounded-2xl bg-gray-100 px-2.5 py-1.5 pb-4">
                <p className="pe-6 text-[9px] leading-relaxed text-gray-900">
                  Uploaded the wireframes — take a look!
                </p>
                <span className="absolute bottom-1 end-2 text-[7px] text-gray-400">
                  10:24
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full justify-end py-0.5">
          <div className="flex max-w-[88%] flex-row-reverse gap-1.5">
            <div className="flex shrink-0 items-end pb-3">
              <MockupAvatar name="You" />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 px-0.5 text-end text-[8px] font-medium text-gray-400">
                You
              </p>
              <div className="relative rounded-2xl bg-primary-100 px-2.5 py-1.5 pb-4">
                <p className="pe-6 text-[9px] leading-relaxed text-gray-900">
                  Looks great. I&apos;ll review after standup.
                </p>
                <span className="absolute bottom-1 end-2 text-[7px] text-gray-400">
                  10:31
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white px-2.5 py-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
          <span className="text-[9px] text-gray-400">Write a message...</span>
        </div>
      </div>
    </div>
  );
}

function ProgressSlideMockup() {
  const stats = [
    { label: 'Total tasks', value: '24', color: 'text-gray-900' },
    { label: 'In progress', value: '8', color: 'text-blue-600' },
    { label: 'Completed', value: '16', color: 'text-emerald-600' },
  ];

  const members = [
    { name: 'Sarah M.', tasks: 6, color: 'from-indigo-500 to-violet-600' },
    { name: 'Alex C.', tasks: 5, color: 'from-blue-500 to-cyan-600' },
    { name: 'Jamie D.', tasks: 4, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="auth-mockup-card w-full max-w-[280px]">
      <div className="auth-mockup-header flex items-center justify-between gap-2">
        <div>
          <p className="auth-mockup-label">Dashboard</p>
          <p className="auth-mockup-title">Progress overview</p>
        </div>
        <LiveBadge />
      </div>

      <div className="flex items-center gap-3 p-3">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="4"
            />
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="#10B981"
              strokeWidth="4"
              strokeDasharray="62 88"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-800">
            67%
          </span>
        </div>
        <div className="flex-1 space-y-1.5">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-[8px] text-gray-500">{stat.label}</span>
              <span className={cn('text-[9px] font-semibold', stat.color)}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 px-3 py-2.5">
        <p className="mb-2 text-[8px] font-medium uppercase tracking-wide text-gray-400">
          Team activity
        </p>
        <div className="space-y-1.5">
          {members.map((member) => (
            <div key={member.name} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[7px] font-semibold text-white',
                  member.color,
                )}
              >
                {member.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </span>
              <span className="flex-1 text-[8px] text-gray-700">
                {member.name}
              </span>
              <span className="text-[8px] font-medium text-gray-500">
                {member.tasks} tasks
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SlideConfig {
  title: string;
  subtitle: string;
  Illustration: ComponentType;
}

const slides: SlideConfig[] = [
  {
    title: 'Kanban boards & task tracking',
    subtitle:
      'Drag tasks between columns with labels, checklists, and live sync.',
    Illustration: KanbanSlideMockup,
  },
  {
    title: 'All tasks in one view',
    subtitle:
      'Search, filter, and manage every task across columns from a single list.',
    Illustration: AllTasksSlideMockup,
  },
  {
    title: 'Team chat & collaboration',
    subtitle:
      'Message your team, share files, and see activity updates in real time.',
    Illustration: ChatSlideMockup,
  },
  {
    title: 'Progress at a glance',
    subtitle:
      'Track completion, team workload, and project health on your dashboard.',
    Illustration: ProgressSlideMockup,
  },
];

const SLIDE_INTERVAL_MS = 5500;

export function AuthShowcase() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative flex h-full min-h-[560px] flex-col bg-[#26c2a3] px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.08),transparent_45%)]" />

      <div className="relative flex flex-1 items-center justify-center px-4 py-6">
        {slides.map((slide, slideIndex) => {
          const Illustration = slide.Illustration;
          const isActive = slideIndex === activeSlide;

          return (
            <div
              key={slide.title}
              className={cn(
                'absolute inset-0 flex items-center justify-center px-4 transition-all duration-700 ease-out',
                isActive
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0',
              )}
              aria-hidden={!isActive}
            >
              <div className="auth-showcase-illustration auth-float-1">
                <div className="auth-float-inner">
                  <Illustration />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 mt-auto text-center">
        <p className="text-sm font-semibold text-white">
          {slides[activeSlide].title}
        </p>
        <p className="mx-auto mt-1.5 max-w-[260px] text-xs leading-relaxed text-white/80">
          {slides[activeSlide].subtitle}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              aria-current={index === activeSlide ? 'true' : undefined}
              onClick={() => setActiveSlide(index)}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                index === activeSlide
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/40 hover:bg-white/60',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
