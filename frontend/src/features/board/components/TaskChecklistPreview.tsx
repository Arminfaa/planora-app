'use client';

import type { TaskChecklistItem } from '@/features/tasks/types';

interface TaskChecklistPreviewProps {
  items?: TaskChecklistItem[];
  maxItems?: number;
}

export function TaskChecklistPreview({
  items = [],
  maxItems = 5,
}: TaskChecklistPreviewProps) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => a.position - b.position);
  const visible = sorted.slice(0, maxItems);
  const hiddenCount = sorted.length - visible.length;

  return (
    <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2">
      {visible.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-1.5 text-xs text-gray-600"
        >
          <span
            aria-hidden
            className={`mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded border ${
              item.isDone
                ? 'border-primary-500 bg-primary-500'
                : 'border-gray-300 bg-white'
            }`}
          />
          <span className={item.isDone ? 'line-through text-gray-400' : ''}>
            {item.title}
          </span>
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className="text-xs text-gray-400">+{hiddenCount} more</li>
      )}
    </ul>
  );
}
