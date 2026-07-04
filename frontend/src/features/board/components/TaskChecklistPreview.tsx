'use client';

import { Checkbox } from 'antd';
import { useEffect, useState } from 'react';
import type { TaskChecklistItem } from '@/features/tasks/types';

interface TaskChecklistPreviewProps {
  items?: TaskChecklistItem[];
  maxItems?: number;
  interactive?: boolean;
  onToggleItem?: (itemId: string, isDone: boolean) => void | Promise<void>;
}

export function TaskChecklistPreview({
  items = [],
  maxItems = 5,
  interactive = false,
  onToggleItem,
}: TaskChecklistPreviewProps) {
  const [localItems, setLocalItems] = useState(items);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  if (localItems.length === 0) return null;

  const sorted = [...localItems].sort((a, b) => a.position - b.position);
  const visible = sorted.slice(0, maxItems);
  const hiddenCount = sorted.length - visible.length;

  const handleToggle = (item: TaskChecklistItem, checked: boolean) => {
    if (!interactive || !onToggleItem) return;

    setLocalItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, isDone: checked } : entry,
      ),
    );

    void Promise.resolve(onToggleItem(item.id, checked)).catch(() => {
      setLocalItems(items);
    });
  };

  return (
    <ul
      className="mt-2 space-y-1 border-t border-gray-100 pt-2"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {visible.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-1.5 text-xs text-gray-600"
        >
          {interactive && onToggleItem ? (
            <Checkbox
              checked={item.isDone}
              onChange={(event) => handleToggle(item, event.target.checked)}
              className="mt-0.5 [&_.ant-checkbox-inner]:border-gray-300"
            />
          ) : (
            <span
              aria-hidden
              className={`mt-0.5 inline-block h-3.5 w-3.5 shrink-0 rounded border ${
                item.isDone
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300 bg-white'
              }`}
            />
          )}
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
