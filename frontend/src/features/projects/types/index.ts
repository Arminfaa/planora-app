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
  id?: string;
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

export interface ProjectProgressMemberWorkload {
  userId: string;
  name: string;
  avatar: string | null;
  assignedTaskCount: number;
}

export interface BoardProgressStats {
  boardId: string;
  boardName: string;
  boardSlug: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionPercent: number;
  teamWorkload: ProjectProgressMemberWorkload[];
}

export interface ProjectProgressStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionPercent: number;
  teamWorkload: ProjectProgressMemberWorkload[];
  boards: BoardProgressStats[];
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
  permissionMode?: PermissionMode;
  customRoles?: CustomRoleInput[];
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

export type NonWorkingReason = 'weekend' | 'holiday' | 'leave';

export interface ProjectHoliday {
  id: string;
  date: string;
  title: string | null;
  titleFa?: string | null;
  titleEn?: string | null;
  builtIn?: boolean;
  source?: 'custom' | 'iran-solar' | 'iran-lunar' | 'gregorian';
  createdAt: string | null;
}

export interface MemberLeave {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  note: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

export interface WorkingCalendar {
  nonWorkingWeekdays: number[];
  holidays: ProjectHoliday[];
  leaves: MemberLeave[];
}

export interface PersonCompletionDay {
  date: string;
  weekday: number;
  completedCount: number;
  isNonWorking: boolean;
  nonWorkingReason: NonWorkingReason | null;
  holidayTitle: string | null;
  holidayTitleFa?: string | null;
  holidayTitleEn?: string | null;
  leaveNote: string | null;
}

export interface PersonCompletionsStats {
  userId: string;
  userName: string | null;
  from: string;
  to: string;
  nonWorkingWeekdays: number[];
  days: PersonCompletionDay[];
  totals: {
    completedTotal: number;
    completedOnWorkingDays: number;
    workingDays: number;
    nonWorkingDays: number;
    averagePerWorkingDay: number;
  };
}
