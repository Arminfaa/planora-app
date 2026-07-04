export type PermissionMode = 'DEFAULT' | 'CUSTOM';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ProjectRoleDefinition {
  id: string;
  name: string;
  permissions: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomRoleInput {
  name: string;
  permissions: string[];
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  permissionMode?: PermissionMode;
  createdAt: string;
  updatedAt: string;
  currentUserRole?: ProjectRole;
  currentUserRoleName?: string | null;
  currentUserRoleDefinitionId?: string | null;
  currentUserPermissions?: string[];
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
  permissionMode?: PermissionMode;
  customRoles?: CustomRoleInput[];
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
  role?: ProjectRole;
  roleDefinitionId?: string;
  roleName?: string;
  joinedAt?: string;
}

export interface ProjectInvite {
  id: string;
  email: string;
  role?: ProjectRole;
  roleDefinitionId?: string;
  roleName?: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface InvitePreview {
  email: string;
  role?: ProjectRole;
  roleDefinitionId?: string;
  roleName?: string;
  projectName: string;
  projectSlug: string;
  expired: boolean;
  accepted: boolean;
  valid: boolean;
}

export interface AddProjectMemberInput {
  email: string;
  role?: Exclude<ProjectRole, 'OWNER'>;
  roleDefinitionId?: string;
}

export interface UpdateProjectMemberInput {
  role?: Exclude<ProjectRole, 'OWNER'>;
  roleDefinitionId?: string;
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
