import { ProjectGanttView } from '@/features/gantt/components/ProjectGanttView';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Gantt');

export default function ProjectGanttPage() {
  return <ProjectGanttView />;
}
