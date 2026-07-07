type DependencyRecord = {
  id: string;
  projectId: string;
  fromTaskId: string;
  toTaskId: string;
  createdAt: Date;
  fromTask?: {
    id: string;
    title: string;
    slug: string;
    boardId: string;
    board?: { id: string; name: string; slug: string } | null;
  } | null;
  toTask?: {
    id: string;
    title: string;
    slug: string;
    boardId: string;
    board?: { id: string; name: string; slug: string } | null;
  } | null;
};

export function serializeTaskDependency(dependency: DependencyRecord) {
  return {
    id: dependency.id,
    projectId: dependency.projectId,
    fromTaskId: dependency.fromTaskId,
    toTaskId: dependency.toTaskId,
    type: 'FINISH_TO_START' as const,
    fromTaskTitle: dependency.fromTask?.title ?? 'Task',
    toTaskTitle: dependency.toTask?.title ?? 'Task',
    fromBoardName: dependency.fromTask?.board?.name ?? 'Board',
    toBoardName: dependency.toTask?.board?.name ?? 'Board',
    createdAt: dependency.createdAt.toISOString(),
  };
}
