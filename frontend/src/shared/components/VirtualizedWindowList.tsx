'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

interface VirtualizedWindowListProps<T> {
  items: T[];
  estimateSize: number;
  threshold?: number;
  overscan?: number;
  gap?: number;
  getItemKey: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

export function VirtualizedWindowList<T>({
  items,
  estimateSize,
  threshold = 40,
  overscan = 8,
  gap = 12,
  getItemKey,
  renderItem,
  className,
}: VirtualizedWindowListProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const shouldVirtualize = items.length >= threshold;

  useLayoutEffect(() => {
    if (!shouldVirtualize) return;
    setScrollMargin(listRef.current?.offsetTop ?? 0);
  }, [shouldVirtualize, items.length]);

  const virtualizer = useWindowVirtualizer({
    count: shouldVirtualize ? items.length : 0,
    estimateSize: () => estimateSize,
    overscan,
    gap,
    scrollMargin,
  });

  if (!shouldVirtualize) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getItemKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className={className}
      style={{
        height: `${virtualizer.getTotalSize()}px`,
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const item = items[virtualItem.index];
        if (!item) return null;

        return (
          <div
            key={virtualItem.key}
            data-index={virtualItem.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start - scrollMargin}px)`,
            }}
          >
            {renderItem(item, virtualItem.index)}
          </div>
        );
      })}
    </div>
  );
}
