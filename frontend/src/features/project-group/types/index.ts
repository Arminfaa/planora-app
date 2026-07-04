export type ProjectGroupMessageType = 'USER' | 'ACTIVITY';

export interface ProjectGroupAuthor {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface ProjectGroupAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'FILE';
  createdAt: string;
}

export interface ProjectGroupMessage {
  id: string;
  projectId: string;
  type: ProjectGroupMessageType;
  content: string | null;
  activityType: string | null;
  activityData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  author: ProjectGroupAuthor | null;
  attachments: ProjectGroupAttachment[];
  canEdit: boolean;
}

export interface CreateGroupMessageInput {
  content?: string;
}

export interface UpdateGroupMessageInput {
  content: string;
}
