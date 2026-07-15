import { ProjectOverviewView } from '@/features/projects/components/ProjectOverviewView';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Overview');

export default function ProjectOverviewPage() {
  return <ProjectOverviewView />;
}
