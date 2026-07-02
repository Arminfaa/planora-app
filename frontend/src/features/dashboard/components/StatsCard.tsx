interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: 'blue' | 'green' | 'purple';
}

const accents = {
  blue: 'bg-primary-50 text-primary-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-violet-50 text-violet-600',
};

export function StatsCard({
  label,
  value,
  icon,
  accent = 'blue',
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-lg ${accents[accent]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
