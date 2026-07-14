import { labelService } from '../services/label.service';
import type { TaskLabel } from '../types';

export async function syncTaskLabels(
  taskId: string,
  original: TaskLabel[],
  draft: TaskLabel[],
): Promise<void> {
  const originalIds = new Set(original.map((label) => label.id));
  const draftIds = new Set(draft.map((label) => label.id));

  await Promise.all([
    ...original
      .filter((label) => !draftIds.has(label.id))
      .map((label) => labelService.remove(taskId, label.id)),
    ...draft
      .filter((label) => !originalIds.has(label.id))
      .map((label) => labelService.assign(taskId, label.id)),
  ]);
}
