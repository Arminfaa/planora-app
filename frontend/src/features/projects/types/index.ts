export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
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
