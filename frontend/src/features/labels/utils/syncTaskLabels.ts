import { labelService } from '../services/label.service';
import type { TaskLabel } from '../types';
import { isTempLabelId, type LabelDraftState } from '../types/draft';

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

export async function syncLabelDraft(
  projectId: string,
  taskId: string,
  originalSelected: TaskLabel[],
  draft: LabelDraftState,
): Promise<void> {
  const idMap = new Map<string, string>();

  for (const label of draft.catalog) {
    if (label.isDeleted && !label.isNew && !isTempLabelId(label.id)) {
      await labelService.delete(projectId, label.id);
    }
  }

  for (const label of draft.catalog) {
    if (!label.isNew || label.isDeleted) continue;
    const created = await labelService.create(projectId, {
      name: label.name.trim(),
      color: label.color,
    });
    idMap.set(label.id, created.id);
  }

  for (const label of draft.catalog) {
    if (label.isNew || label.isDeleted || !label.isDirty) continue;
    await labelService.update(projectId, label.id, {
      name: label.name.trim(),
      color: label.color,
    });
  }

  const deletedIds = new Set(
    draft.catalog
      .filter((label) => label.isDeleted && !label.isNew)
      .map((label) => label.id),
  );

  const resolvedSelected: TaskLabel[] = [];
  for (const selectedId of draft.selectedIds) {
    if (deletedIds.has(selectedId)) continue;
    const definition = draft.catalog.find((label) => label.id === selectedId);
    if (!definition || definition.isDeleted) continue;

    const resolvedId = idMap.get(selectedId) ?? selectedId;
    if (isTempLabelId(resolvedId)) continue;

    resolvedSelected.push({
      id: resolvedId,
      name: definition.name.trim(),
      color: definition.color,
    });
  }

  const survivingOriginal = originalSelected.filter(
    (label) => !deletedIds.has(label.id),
  );

  await syncTaskLabels(taskId, survivingOriginal, resolvedSelected);
}
