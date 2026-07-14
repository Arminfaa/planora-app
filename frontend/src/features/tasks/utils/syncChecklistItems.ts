import { checklistService } from '../services/checklist.service';
import type { TaskChecklistItem } from '../types';
import { normalizeChecklistWeight } from './checklistProgress';

export type DraftChecklistItem = {
  id: string;
  title: string;
  isDone: boolean;
  weight?: number;
  position: number;
};

export function isTempChecklistId(id: string): boolean {
  return id.startsWith('temp-checklist-');
}

export function createTempChecklistId(): string {
  return `temp-checklist-${crypto.randomUUID()}`;
}

export async function syncChecklistItems(
  taskId: string,
  original: TaskChecklistItem[],
  draft: DraftChecklistItem[],
): Promise<void> {
  const originalById = new Map(original.map((item) => [item.id, item]));
  const draftIds = new Set(draft.map((item) => item.id));

  for (const item of original) {
    if (!draftIds.has(item.id)) {
      await checklistService.delete(taskId, item.id);
    }
  }

  for (const item of draft) {
    const title = item.title.trim();
    if (!title) continue;

    const weight = normalizeChecklistWeight(item.weight);

    if (isTempChecklistId(item.id)) {
      const created = await checklistService.create(taskId, { title, weight });
      if (item.isDone) {
        await checklistService.update(taskId, created.id, { isDone: true });
      }
      continue;
    }

    const previous = originalById.get(item.id);
    if (!previous) continue;

    const patch: { title?: string; isDone?: boolean; weight?: number } = {};
    if (previous.title !== title) patch.title = title;
    if (Boolean(previous.isDone) !== Boolean(item.isDone)) {
      patch.isDone = item.isDone;
    }
    if (normalizeChecklistWeight(previous.weight) !== weight) {
      patch.weight = weight;
    }

    if (Object.keys(patch).length > 0) {
      await checklistService.update(taskId, item.id, patch);
    }
  }
}
