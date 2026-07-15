import { ProjectSettingsView } from '@/features/projects/components/ProjectSettingsView';
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata('Settings');

export default function ProjectSettingsPage() {
  return <ProjectSettingsView />;
}
