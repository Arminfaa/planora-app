import type { ProjectLabel, TaskLabel } from './index';

export type DraftLabelDefinition = {
  id: string;
  name: string;
  color: string;
  isNew?: boolean;
  isDirty?: boolean;
  isDeleted?: boolean;
};

export type LabelDraftState = {
  catalog: DraftLabelDefinition[];
  selectedIds: string[];
};

export function isTempLabelId(id: string): boolean {
  return id.startsWith('temp-label-');
}

export function createTempLabelId(): string {
  return `temp-label-${crypto.randomUUID()}`;
}

export function createLabelDraftState(
  projectLabels: ProjectLabel[],
  selectedLabels: TaskLabel[],
): LabelDraftState {
  return {
    catalog: projectLabels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
    selectedIds: selectedLabels.map((label) => label.id),
  };
}

export function getVisibleDraftLabels(
  draft: LabelDraftState,
): DraftLabelDefinition[] {
  return draft.catalog.filter((label) => !label.isDeleted);
}

export function getSelectedDraftLabels(draft: LabelDraftState): TaskLabel[] {
  const byId = new Map(
    getVisibleDraftLabels(draft).map((label) => [label.id, label]),
  );

  return draft.selectedIds
    .map((id) => byId.get(id))
    .filter((label): label is DraftLabelDefinition => Boolean(label))
    .map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    }));
}
