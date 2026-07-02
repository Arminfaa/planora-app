'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(500).optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function DashboardPage() {
  const { projects, isLoading, error, createProject } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  });

  const onSubmit = async (data: CreateProjectForm) => {
    setSubmitError('');
    try {
      await createProject(data);
      reset();
      setShowForm(false);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your projects and boards
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Project'}
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Create Project
          </h2>
          {submitError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Project Name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Description (optional)"
              error={errors.description?.message}
              {...register('description')}
            />
            <Button type="submit" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-600">No projects yet.</p>
          <Button className="mt-4" onClick={() => setShowForm(true)}>
            Create your first project
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
