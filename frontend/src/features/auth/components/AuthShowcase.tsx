'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { cn } from '@/lib/utils';

type MockupCard = ComponentType;

function KanbanMockup() {
  const columns = [
    { name: 'To Do', color: '#6B7280', tasks: ['Design sprint', 'API review'] },
    { name: 'In Progress', color: '#3B82F6', tasks: ['Board UI'] },
    { name: 'Done', color: '#10B981', tasks: ['Auth flow'] },
  ];

  return (
    <div className="auth-mockup-card w-[210px]">
      <div className="auth-mockup-header">
        <p className="auth-mockup-label">Sprint board</p>
        <p className="auth-mockup-title">Product launch</p>
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
                key={task}
                className="mb-1 rounded border border-gray-100 bg-white px-1.5 py-1 text-[9px] font-medium text-gray-700 shadow-sm"
              >
                {task}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GanttMockup() {
  const bars = [
    { label: 'Planning', color: '#3B82F6', width: '48%', left: '4%' },
    { label: 'Design', color: '#10B981', width: '36%', left: '18%' },
    { label: 'Development', color: '#F59E0B', width: '52%', left: '28%' },
    { label: 'Launch', color: '#8B5CF6', width: '28%', left: '62%' },
  ];

  return (
    <div className="auth-mockup-card w-[230px]">
      <div className="auth-mockup-header">
        <p className="auth-mockup-label">Timeline</p>
        <p className="auth-mockup-title">Project Gantt</p>
      </div>
      <div className="space-y-2.5 p-3">
        {bars.map((bar) => (
          <div key={bar.label} className="relative h-5">
            <span className="absolute right-0 top-0 text-[8px] text-gray-400">
              {bar.label}
            </span>
            <div
              className="absolute bottom-0 h-2.5 rounded-full"
              style={{
                width: bar.width,
                left: bar.left,
                backgroundColor: bar.color,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="auth-mockup-card w-[190px]">
      <div className="border-b border-indigo-100 bg-indigo-50 px-3 py-2">
        <p className="auth-mockup-label text-indigo-400">Project group</p>
        <p className="auth-mockup-title">Team chat</p>
      </div>
      <div className="space-y-1.5 p-2.5">
        <div className="rounded-lg bg-indigo-50 px-2 py-1.5 text-[9px] leading-snug text-gray-600">
          Sarah moved &quot;Board UI&quot; to Done
        </div>
        <div className="mr-3 rounded-lg border border-gray-100 bg-white px-2 py-1.5">
          <p className="text-[8px] font-medium text-gray-400">Alex</p>
          <p className="text-[9px] text-gray-700">Wireframes are ready!</p>
        </div>
        <div className="ml-3 rounded-lg border border-primary-100 bg-primary-50 px-2 py-1.5">
          <p className="text-[9px] text-gray-700">Looks great, thanks!</p>
        </div>
      </div>
    </div>
  );
}

function StatsMockup() {
  return (
    <div className="auth-mockup-card w-[168px] p-3">
      <p className="auth-mockup-label">Overview</p>
      <div className="mt-2 flex items-center gap-2.5">
        <div className="relative h-12 w-12 shrink-0">
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
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-800">
            72%
          </span>
        </div>
        <div className="space-y-1">
          {[
            { color: 'bg-emerald-500', label: 'Done' },
            { color: 'bg-blue-500', label: 'In progress' },
            { color: 'bg-amber-500', label: 'On track' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className={cn('h-1.5 w-1.5 rounded-full', item.color)} />
              <span className="text-[8px] text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type CardSlot = 'hero' | 'bottomLeft' | 'topRight';

interface SlideConfig {
  title: string;
  layout: Record<CardSlot, MockupCard>;
}

const slides: SlideConfig[] = [
  {
    title: 'Kanban boards & task tracking',
    layout: {
      hero: KanbanMockup,
      bottomLeft: StatsMockup,
      topRight: GanttMockup,
    },
  },
  {
    title: 'Gantt charts & timelines',
    layout: {
      hero: GanttMockup,
      bottomLeft: KanbanMockup,
      topRight: StatsMockup,
    },
  },
  {
    title: 'Team chat & collaboration',
    layout: {
      hero: ChatMockup,
      bottomLeft: StatsMockup,
      topRight: KanbanMockup,
    },
  },
  {
    title: 'Progress at a glance',
    layout: {
      hero: StatsMockup,
      bottomLeft: GanttMockup,
      topRight: ChatMockup,
    },
  },
];

const slotConfig: Record<CardSlot, { className: string; floatClass: string }> =
  {
    hero: {
      className: 'auth-card-slot-hero',
      floatClass: 'auth-float-1',
    },
    bottomLeft: {
      className: 'auth-card-slot-bottom-left',
      floatClass: 'auth-float-2',
    },
    topRight: {
      className: 'auth-card-slot-top-right',
      floatClass: 'auth-float-3',
    },
  };

const SLIDE_INTERVAL_MS = 5000;

function CardStage({ layout }: { layout: SlideConfig['layout'] }) {
  return (
    <div className="auth-card-stage">
      {(Object.keys(slotConfig) as CardSlot[]).map((slot) => {
        const Card = layout[slot];
        const { className, floatClass } = slotConfig[slot];

        return (
          <div
            key={slot}
            className={cn('auth-card-slot', className, floatClass)}
          >
            <div className="auth-float-inner">
              <Card />
            </div>
          </div>
        );
      })}
    </div>
  );
}

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

      <div className="relative flex flex-1 items-center justify-center px-2 py-6">
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.title}
            className={cn(
              'absolute inset-0 flex items-center justify-center px-2 transition-all duration-700',
              slideIndex === activeSlide
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-3 opacity-0',
            )}
          >
            <CardStage layout={slide.layout} />
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-auto text-center">
        <p className="text-sm font-medium text-white/95">
          {slides[activeSlide].title}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show slide ${index + 1}`}
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
