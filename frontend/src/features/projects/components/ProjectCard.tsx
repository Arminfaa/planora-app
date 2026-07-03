import Link from 'next/link';
import type { Project } from '../types';
import { formatDate } from '@/features/dashboard/utils/stats';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/dashboard/projects/${project.slug}`}
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-primary-300 hover:shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
      {project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
          {project.description}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{project._count?.boards ?? 0} boards</span>
          <span>{project._count?.members ?? 0} members</span>
        </div>
        <span className="text-xs text-gray-400">
          {formatDate(project.updatedAt)}
        </span>
      </div>
      {project.owner && (
        <p className="mt-3 text-xs text-gray-500">
          Owner: {project.owner.name}
        </p>
      )}
    </Link>
  );
}
