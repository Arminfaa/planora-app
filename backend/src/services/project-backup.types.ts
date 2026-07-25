export const PLANORA_BACKUP_VERSION = 1 as const;
export const PLANORA_BACKUP_APP = 'planora' as const;

export interface BackupUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  avatar: string | null;
  avatarFileKey: string | null;
}

export interface BackupMember {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  roleDefinitionId: string | null;
  joinedAt: string;
}

export interface BackupRoleDefinition {
  id: string;
  name: string;
  permissions: string[];
  position: number;
}

export interface BackupBoard {
  id: string;
  name: string;
  slug: string;
  position: number;
  backgroundUrl: string | null;
  backgroundStorageKey: string | null;
  backgroundStorageProvider: string | null;
  backgroundFileKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupColumn {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupLabel {
  id: string;
  name: string;
  color: string;
}

export interface BackupTask {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  columnId: string;
  boardId: string;
  position: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate: string | null;
  dueDate: string | null;
  completeDate: string | null;
  progress: number;
  isCompleted: boolean;
  autoCompleteSuppressed: boolean;
  parentTaskId: string | null;
  assigneeIds: string[];
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupTaskLabel {
  taskId: string;
  labelId: string;
}

export interface BackupChecklistItem {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  completedAt: string | null;
  weight: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackupComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackupAttachment {
  id: string;
  taskId: string;
  filename: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'FILE';
  fileKey: string;
  createdAt: string;
}

export interface BackupDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  createdById: string;
  createdAt: string;
}

export interface BackupHoliday {
  id: string;
  date: string;
  title: string | null;
  createdAt: string;
}

export interface BackupLeave {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  note: string | null;
  createdById: string;
  createdAt: string;
}

export interface BackupGroupAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'FILE';
  fileKey: string;
  createdAt: string;
}

export interface BackupGroupMessage {
  id: string;
  type: 'USER' | 'ACTIVITY';
  content: string | null;
  authorId: string | null;
  activityType: string | null;
  activityData: unknown;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  attachments: BackupGroupAttachment[];
}

export interface BackupFileEntry {
  key: string;
  mimeType: string;
  filename: string;
  dataBase64: string;
}

export interface ProjectBackupArchive {
  version: typeof PLANORA_BACKUP_VERSION;
  app: typeof PLANORA_BACKUP_APP;
  exportedAt: string;
  project: {
    name: string;
    slug: string;
    description: string | null;
    permissionMode: 'DEFAULT' | 'CUSTOM';
    nonWorkingWeekdays: number[];
    createdAt: string;
    updatedAt: string;
    ownerId: string;
  };
  users: BackupUser[];
  members: BackupMember[];
  roleDefinitions: BackupRoleDefinition[];
  boards: BackupBoard[];
  columns: BackupColumn[];
  labels: BackupLabel[];
  tasks: BackupTask[];
  taskLabels: BackupTaskLabel[];
  checklistItems: BackupChecklistItem[];
  comments: BackupComment[];
  attachments: BackupAttachment[];
  dependencies: BackupDependency[];
  holidays: BackupHoliday[];
  leaves: BackupLeave[];
  groupMessages: BackupGroupMessage[];
  files: BackupFileEntry[];
}

export interface ProjectBackupImportResult {
  projectId: string;
  projectSlug: string;
  projectName: string;
  usersCreated: number;
  usersReused: number;
  boards: number;
  tasks: number;
  members: number;
  filesRestored: number;
  filesSkipped: number;
}
