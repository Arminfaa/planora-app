export const DEFAULT_CHECKLIST_WEIGHT = 5;
export const MIN_CHECKLIST_WEIGHT = 1;
export const MAX_CHECKLIST_WEIGHT = 10;

export function normalizeChecklistWeight(
  weight: number | null | undefined,
): number {
  if (weight == null || Number.isNaN(weight)) {
    return DEFAULT_CHECKLIST_WEIGHT;
  }

  return Math.min(
    MAX_CHECKLIST_WEIGHT,
    Math.max(MIN_CHECKLIST_WEIGHT, Math.round(weight)),
  );
}

export function computeChecklistProgress(
  items: Array<{ isDone: boolean; weight?: number | null }>,
): number {
  if (items.length === 0) return 0;

  let doneWeight = 0;
  let totalWeight = 0;

  for (const item of items) {
    const weight = normalizeChecklistWeight(item.weight);
    totalWeight += weight;
    if (item.isDone) {
      doneWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;

  return Math.round((doneWeight / totalWeight) * 100);
}
