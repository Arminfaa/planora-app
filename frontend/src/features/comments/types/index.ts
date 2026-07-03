export interface TaskComment {
  id: string;
  content: string;
  taskId: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export interface CreateCommentInput {
  content: string;
}
