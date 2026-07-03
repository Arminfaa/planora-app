export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors: string[];
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: Record<string, number>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

export interface AuthData {
  user: User;
  token: string;
  inviteAcceptance?: {
    projectId: string;
    projectSlug: string;
    alreadyMember?: boolean;
  } | null;
}
