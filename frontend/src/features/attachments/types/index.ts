export type AttachmentType = 'IMAGE' | 'FILE' | 'LINK';

export interface TaskAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: AttachmentType;
  taskId: string;
  createdAt: string;
}
