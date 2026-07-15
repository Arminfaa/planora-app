import { ProjectGroupView } from '@/features/projects/components/ProjectGroupView';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Group');

export default function ProjectGroupPage() {
  return <ProjectGroupView />;
}
