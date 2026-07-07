'use client';

import { useMemo } from 'react';
import type { GanttDependency, GanttTaskRowLayout } from '../types';
import { buildDependencyLinks } from '../utils/dependencyLayout';

interface GanttDependencyLayerProps {
  dependencies: GanttDependency[];
  layouts: Map<string, GanttTaskRowLayout>;
  width: number;
  height: number;
}

export function GanttDependencyLayer({
  dependencies,
  layouts,
  width,
  height,
}: GanttDependencyLayerProps) {
  const links = useMemo(
    () => buildDependencyLinks(dependencies, layouts),
    [dependencies, layouts],
  );

  if (links.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
      width={width}
      height={height}
      aria-hidden
    >
      <defs>
        <marker
          id="gantt-dependency-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
        </marker>
      </defs>
      {links.map((link) => (
        <path
          key={link.id}
          d={link.path}
          fill="none"
          stroke="#64748b"
          strokeWidth="1.5"
          markerEnd="url(#gantt-dependency-arrow)"
        />
      ))}
    </svg>
  );
}
