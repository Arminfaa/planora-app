export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: ProjectRole;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    boards: number;
    members: number;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export interface ProjectMember {
  id: string;
  membershipId?: string;
  name: string;
  email: string;
  avatar: string | null;
  role: ProjectRole;
  joinedAt?: string;
}

export interface ProjectInvite {
  id: string;
  email: string;
  role: ProjectRole;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitePreview {
  email: string;
  role: ProjectRole;
  projectName: string;
  projectSlug: string;
  expired: boolean;
  accepted: boolean;
  valid: boolean;
}

export interface AddProjectMemberInput {
  email: string;
  role?: Exclude<ProjectRole, 'OWNER'>;
}

export interface AddMemberResult {
  type: 'member';
  member: ProjectMember;
}

export interface CreateInviteResult {
  type: 'invite';
  invite: ProjectInvite;
  project: { id: string; name: string; slug: string };
}
