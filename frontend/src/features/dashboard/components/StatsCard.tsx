interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: 'blue' | 'green' | 'purple';
  variant?: 'default' | 'glass';
}

const accents = {
  blue: 'bg-primary-50 text-primary-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-violet-50 text-violet-600',
};

const glassAccents = {
  blue: 'bg-primary-500/10 text-primary-600',
  green: 'bg-emerald-500/10 text-emerald-600',
  purple: 'bg-violet-500/10 text-violet-600',
};

export function StatsCard({
  label,
  value,
  icon,
  accent = 'blue',
  variant = 'default',
}: StatsCardProps) {
  const isGlass = variant === 'glass';

  return (
    <div
      className={
        isGlass
          ? 'rounded-xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md'
          : 'rounded-xl border border-gray-200 bg-white p-6 shadow-sm'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p
            className={`mt-1 font-bold text-gray-900 ${isGlass ? 'text-2xl' : 'text-3xl'}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isGlass ? glassAccents[accent] : accents[accent]
          }`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
