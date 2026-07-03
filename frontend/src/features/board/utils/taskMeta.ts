export function getTaskAttachmentCount(task: {
  _count?: { attachments?: number };
}): number {
  return task._count?.attachments ?? 0;
}
