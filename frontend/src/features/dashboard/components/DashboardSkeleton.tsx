'use client';

export function DashboardSkeleton() {
  return (
    <div className="min-h-[calc(100vh-4rem)] animate-pulse">
      <div className="border-b border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="h-8 w-48 rounded-lg bg-indigo-100/80" />
          <div className="mt-3 h-4 w-72 max-w-full rounded bg-indigo-50" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-2xl border border-white/60 bg-white/70"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 h-6 w-40 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-xl border border-gray-100 bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
