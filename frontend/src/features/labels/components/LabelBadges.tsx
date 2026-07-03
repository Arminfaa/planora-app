import type { TaskLabel } from '../types';

interface LabelBadgesProps {
  labels: TaskLabel[];
  className?: string;
}

export function LabelBadges({ labels, className = '' }: LabelBadgesProps) {
  if (!labels.length) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {labels.map((label) => (
        <span
          key={label.id}
          className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: label.color }}
        >
          {label.name}
        </span>
      ))}
    </div>
  );
}
