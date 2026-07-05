export const queryKeys = {
  projects: {
    all: ['projects'] as const,
    list: (page: number, limit = 10) =>
      ['projects', 'list', page, limit] as const,
    detail: (slug: string) => ['projects', 'detail', slug] as const,
    members: (projectId: string) => ['projects', projectId, 'members'] as const,
    invites: (projectId: string) => ['projects', projectId, 'invites'] as const,
    roles: (projectId: string) => ['projects', projectId, 'roles'] as const,
    labels: (projectId: string) => ['projects', projectId, 'labels'] as const,
    boards: (projectId: string) => ['projects', projectId, 'boards'] as const,
    progress: (projectId: string) =>
      ['projects', projectId, 'progress'] as const,
  },
  boards: {
    bySlug: (projectSlug: string, boardSlug: string) =>
      ['boards', projectSlug, boardSlug] as const,
  },
  search: {
    assignees: ['search', 'assignees'] as const,
  },
  invites: {
    preview: (token: string) => ['invites', 'preview', token] as const,
  },
} as const;

export const STALE_TIME = {
  projectsList: 60_000,
  projectDetail: 120_000,
  members: 120_000,
  invites: 60_000,
  roles: 300_000,
  labels: 300_000,
  boards: 60_000,
  boardDetail: 30_000,
  progress: 30_000,
  searchAssignees: 300_000,
  invitePreview: 60_000,
} as const;
