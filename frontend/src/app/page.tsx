import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Project Management Platform
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Manage projects, tasks, and teams with Kanban boards and real-time
          collaboration.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
