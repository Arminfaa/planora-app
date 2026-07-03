'use client';

import { useEffect, useState } from 'react';
import { projectService } from '../services/project.service';
import type { ProjectMember } from '../types';

export function useProjectMembers(projectId: string | null) {
  const [members, setMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    if (!projectId) {
      setMembers([]);
      return;
    }

    const fetchMembers = async () => {
      try {
        const data = await projectService.listMembers(projectId);
        setMembers(data);
      } catch {
        setMembers([]);
      }
    };

    void fetchMembers();
  }, [projectId]);

  return members;
}
