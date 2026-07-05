'use client';

import { useState } from 'react';
import { Segmented } from 'antd';
import { getAssetUrl } from '@/lib/assets';
import { AssetImage } from '@/shared/components/ui/AssetImage';
import { cn } from '@/lib/utils';
import type { BoardProgressStats, ProjectProgressStats } from '../types';

interface ProjectProgressOverviewProps {
  stats: ProjectProgressStats;
}

type ProgressView = 'all' | 'by-board';

const accentColors = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-lime-500 to-green-600',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function ProgressRing({
  percent,
  size = 'md',
}: {
  percent: number;
  size?: 'sm' | 'md';
}) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference - (clamped / 100) * circumference;
  const dimension = size === 'sm' ? 'h-14 w-14' : 'h-20 w-20';
  const labelClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className={cn('relative shrink-0', dimension)}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="4"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#10B981"
          strokeWidth="4"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center font-bold text-gray-900',
          labelClass,
        )}
      >
        {clamped}%
      </span>
    </div>
  );
}

function ProgressStatRows({
  totalTasks,
  inProgressTasks,
  completedTasks,
  compact = false,
}: {
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  compact?: boolean;
}) {
  const items = [
    { label: 'Total tasks', value: totalTasks, color: 'text-gray-900' },
    { label: 'In progress', value: inProgressTasks, color: 'text-blue-600' },
    { label: 'Completed', value: completedTasks, color: 'text-emerald-600' },
  ];

  return (
    <div className={cn('flex-1 space-y-2', compact && 'space-y-1.5')}>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-4"
        >
          <span
            className={cn('text-gray-500', compact ? 'text-xs' : 'text-sm')}
          >
            {item.label}
          </span>
          <span
            className={cn(
              'font-semibold',
              item.color,
              compact ? 'text-xs' : 'text-sm',
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function TeamWorkloadList({
  teamWorkload,
  compact = false,
}: {
  teamWorkload: ProjectProgressStats['teamWorkload'];
  compact?: boolean;
}) {
  if (teamWorkload.length === 0) {
    return (
      <p
        className={cn(
          'text-gray-500',
          compact ? 'mt-2 text-xs' : 'mt-3 text-sm',
        )}
      >
        {compact
          ? 'No assigned tasks on this board yet.'
          : 'No assigned tasks yet. Assign team members on board tasks to see workload here.'}
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', compact ? 'mt-2' : 'mt-3 space-y-2.5')}>
      {teamWorkload.map((member, index) => {
        const avatarUrl = member.avatar ? getAssetUrl(member.avatar) : null;
        const avatarSize = compact ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';
        const textSize = compact ? 'text-xs' : 'text-sm';

        return (
          <div key={member.userId} className="flex items-center gap-2.5">
            {avatarUrl ? (
              <AssetImage
                src={avatarUrl}
                alt=""
                width={compact ? 24 : 32}
                height={compact ? 24 : 32}
                resolveAsset={false}
                className={cn('shrink-0 rounded-full object-cover', avatarSize)}
              />
            ) : (
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white',
                  avatarSize,
                  accentColors[index % accentColors.length],
                )}
              >
                {getInitials(member.name)}
              </span>
            )}
            <span
              className={cn('min-w-0 flex-1 truncate text-gray-700', textSize)}
            >
              {member.name}
            </span>
            <span
              className={cn('shrink-0 font-medium text-gray-500', textSize)}
            >
              {member.assignedTaskCount}{' '}
              {member.assignedTaskCount === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BoardProgressCard({ board }: { board: BoardProgressStats }) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <ProgressRing percent={board.completionPercent} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">
            {board.boardName}
          </h3>
          <ProgressStatRows
            totalTasks={board.totalTasks}
            inProgressTasks={board.inProgressTasks}
            completedTasks={board.completedTasks}
            compact
          />
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          Team workload
        </p>
        <TeamWorkloadList teamWorkload={board.teamWorkload} compact />
      </div>
    </div>
  );
}

export function ProjectProgressOverview({
  stats,
}: ProjectProgressOverviewProps) {
  const [view, setView] = useState<ProgressView>('all');

  const subtitle =
    view === 'all'
      ? 'Combined progress across every board in this project'
      : 'Progress broken down by board';

  return (
    <div className="rounded-xl border border-white/60 bg-white/70 shadow-sm backdrop-blur-md">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              Progress overview
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
          </div>

          <div className="progress-overview-segment shrink-0 sm:min-w-[240px]">
            <Segmented
              block
              value={view}
              onChange={(value) => setView(value as ProgressView)}
              options={[
                { label: 'All boards', value: 'all' },
                { label: 'By board', value: 'by-board' },
              ]}
            />
          </div>
        </div>
      </div>

      {view === 'all' ? (
        <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-start">
          <div className="flex items-center gap-4 lg:min-w-[240px]">
            <ProgressRing percent={stats.completionPercent} />
            <ProgressStatRows
              totalTasks={stats.totalTasks}
              inProgressTasks={stats.inProgressTasks}
              completedTasks={stats.completedTasks}
            />
          </div>

          <div className="min-w-0 flex-1 border-t border-gray-100 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Team workload
            </p>
            <TeamWorkloadList teamWorkload={stats.teamWorkload} />
          </div>
        </div>
      ) : stats.boards.length === 0 ? (
        <div className="p-5">
          <p className="text-sm text-gray-500">
            No boards yet. Create a board to track progress here.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.boards.map((board) => (
            <BoardProgressCard key={board.boardId} board={board} />
          ))}
        </div>
      )}
    </div>
  );
}
