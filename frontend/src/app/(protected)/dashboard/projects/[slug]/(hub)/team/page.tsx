import { ProjectTeamView } from '@/features/projects/components/ProjectTeamView';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Team');

export default function ProjectTeamPage() {
  return <ProjectTeamView />;
}
