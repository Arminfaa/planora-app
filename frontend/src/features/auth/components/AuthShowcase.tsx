'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { getPriorityStyles } from '@/features/tasks/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

function LiveBadge() {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-medium text-emerald-700 ring-1 ring-emerald-100">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      {t('common.live')}
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
  const { t } = useLocale();
  const columns = [
    {
      name: t('landing.preview.columns.todo'),
      color: '#6B7280',
      tasks: [
        {
          title: t('landing.preview.demoTasks.designLanding'),
          labels: [t('landing.preview.demoLabels.design')],
        },
        {
          title: t('landing.preview.demoTasks.apiReview'),
          labels: [t('landing.preview.demoLabels.backend')],
        },
      ],
    },
    {
      name: t('landing.preview.columns.inProgress'),
      color: '#3B82F6',
      tasks: [
        {
          title: t('landing.preview.demoTasks.boardUI'),
          labels: [t('landing.preview.demoLabels.frontend')],
          checklist: '2/4',
        },
      ],
    },
    {
      name: t('landing.preview.columns.done'),
      color: '#10B981',
      tasks: [
        {
          title: t('landing.preview.demoTasks.authFlow'),
          labels: [t('landing.preview.demoLabels.done')],
        },
      ],
    },
  ];

  return (
    <div className="auth-mockup-card w-full max-w-[300px]">
      <div className="auth-mockup-header flex items-center justify-between gap-2">
        <div>
          <p className="auth-mockup-label">
            {t('auth.showcase.mockups.sprintBoard')}
          </p>
          <p className="auth-mockup-title">
            {t('auth.showcase.mockups.productLaunch')}
          </p>
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
  const { t } = useLocale();
  const priorityStyles = getPriorityStyles(t);
  const tasks = [
    {
      title: t('landing.preview.demoTasks.boardUI'),
      column: t('landing.preview.columns.inProgress'),
      priority: priorityStyles.HIGH.label,
      priorityColor: 'text-red-600 bg-red-50',
      assignee: 'AC',
    },
    {
      title: t('landing.preview.demoTasks.designLanding'),
      column: t('landing.preview.columns.todo'),
      priority: priorityStyles.MEDIUM.label,
      priorityColor: 'text-amber-600 bg-amber-50',
      assignee: 'SM',
    },
    {
      title: t('landing.preview.demoTasks.authFlow'),
      column: t('landing.preview.columns.done'),
      priority: priorityStyles.LOW.label,
      priorityColor: 'text-gray-600 bg-gray-100',
      assignee: 'JD',
    },
    {
      title: t('landing.preview.demoTasks.apiReview'),
      column: t('landing.preview.columns.todo'),
      priority: priorityStyles.HIGH.label,
      priorityColor: 'text-red-600 bg-red-50',
      assignee: 'RK',
    },
  ];

  return (
    <div className="auth-mockup-card w-full max-w-[300px]">
      <div className="auth-mockup-header">
        <p className="auth-mockup-label">
          {t('auth.showcase.mockups.boardView')}
        </p>
        <p className="auth-mockup-title">
          {t('auth.showcase.mockups.allTasks')}
        </p>
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
          <span className="text-[9px] text-gray-400">
            {t('auth.showcase.mockups.searchTasks')}
          </span>
          <span className="ms-auto rounded bg-primary-100 px-1.5 py-px text-[7px] font-medium text-primary-700">
            {t('common.filter')}
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
  const { t } = useLocale();
  return (
    <div className="auth-mockup-card w-full max-w-[280px]">
      <div className="auth-mockup-header flex items-center justify-between gap-2">
        <div>
          <p className="auth-mockup-label">
            {t('auth.showcase.mockups.projectGroup')}
          </p>
          <p className="auth-mockup-title">
            {t('auth.showcase.mockups.productLaunch')}
          </p>
        </div>
        <LiveBadge />
      </div>

      <div className="space-y-0.5 bg-gray-50/60 px-2.5 py-1.5">
        <div className="py-0.5 text-center">
          <span className="text-[8px] font-medium text-gray-400">
            {t('common.today')}
          </span>
        </div>

        <div className="flex flex-col items-center py-0.5">
          <div className="max-w-[92%] rounded-full bg-gray-100 px-2.5 py-1 text-center">
            <p className="text-[8px] leading-relaxed text-gray-600">
              {t('landing.preview.activityMoved', {
                user: t('landing.preview.demoNames.sarah'),
                task: t('landing.preview.demoTasks.boardUI'),
                column: t('landing.preview.columns.inProgress'),
              })}
            </p>
          </div>
        </div>

        <div className="flex w-full justify-start py-0.5">
          <div className="flex max-w-[88%] gap-1.5">
            <div className="flex shrink-0 items-end pb-3">
              <MockupAvatar name={t('landing.preview.demoNames.alexChen')} />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 px-0.5 text-[8px] font-medium text-gray-400">
                {t('landing.preview.demoNames.alexChen')}
              </p>
              <div className="relative rounded-2xl bg-gray-100 px-2.5 py-1.5 pb-4">
                <p className="pe-6 text-[9px] leading-relaxed text-gray-900">
                  {t('landing.preview.uploadedWireframes')}
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
              <MockupAvatar name={t('common.you')} />
            </div>
            <div className="min-w-0">
              <p className="mb-0.5 px-0.5 text-end text-[8px] font-medium text-gray-400">
                {t('common.you')}
              </p>
              <div className="relative rounded-2xl bg-primary-100 px-2.5 py-1.5 pb-4">
                <p className="pe-6 text-[9px] leading-relaxed text-gray-900">
                  {t('landing.preview.reviewAfterStandup')}
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
          <span className="text-[9px] text-gray-400">
            {t('landing.preview.writeMessage')}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProgressSlideMockup() {
  const { t } = useLocale();
  const stats = [
    { label: t('projects.totalTasks'), value: '24', color: 'text-gray-900' },
    { label: t('projects.inProgress'), value: '8', color: 'text-blue-600' },
    { label: t('projects.completed'), value: '16', color: 'text-emerald-600' },
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
          <p className="auth-mockup-label">
            {t('auth.showcase.mockups.dashboard')}
          </p>
          <p className="auth-mockup-title">
            {t('auth.showcase.mockups.progressOverview')}
          </p>
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
          {t('auth.showcase.mockups.teamActivity')}
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
                {t('auth.showcase.mockups.tasksCount', { count: member.tasks })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SlideConfig {
  titleKey: string;
  subtitleKey: string;
  Illustration: ComponentType;
}

const SLIDE_KEYS: SlideConfig[] = [
  {
    titleKey: 'auth.showcase.slides.kanban.title',
    subtitleKey: 'auth.showcase.slides.kanban.subtitle',
    Illustration: KanbanSlideMockup,
  },
  {
    titleKey: 'auth.showcase.slides.allTasks.title',
    subtitleKey: 'auth.showcase.slides.allTasks.subtitle',
    Illustration: AllTasksSlideMockup,
  },
  {
    titleKey: 'auth.showcase.slides.chat.title',
    subtitleKey: 'auth.showcase.slides.chat.subtitle',
    Illustration: ChatSlideMockup,
  },
  {
    titleKey: 'auth.showcase.slides.progress.title',
    subtitleKey: 'auth.showcase.slides.progress.subtitle',
    Illustration: ProgressSlideMockup,
  },
];

const SLIDE_INTERVAL_MS = 5500;

export function AuthShowcase() {
  const { t } = useLocale();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = useMemo(
    () =>
      SLIDE_KEYS.map((slide, index) => ({
        id: index,
        title: t(slide.titleKey),
        subtitle: t(slide.subtitleKey),
        Illustration: slide.Illustration,
      })),
    [t],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slides.length]);

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
              key={slide.id}
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
              aria-label={t('auth.showcase.showSlide', {
                index: index + 1,
                title: slide.title,
              })}
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
