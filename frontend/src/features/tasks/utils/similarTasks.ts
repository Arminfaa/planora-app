export const TITLE_SIMILARITY_THRESHOLD = 0.75;

/** Normalize task titles for fuzzy comparison (EN + FA). */
export function normalizeTaskTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200f\u202a-\u202e]/g, '') // ZWNJ / bidi marks
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(value: string): Map<string, number> {
  const map = new Map<string, number>();
  if (value.length < 2) {
    if (value.length === 1) map.set(value, 1);
    return map;
  }
  for (let i = 0; i < value.length - 1; i++) {
    const gram = value.slice(i, i + 2);
    map.set(gram, (map.get(gram) ?? 0) + 1);
  }
  return map;
}

/** Dice coefficient on character bigrams (0–1). */
export function titleSimilarity(a: string, b: string): number {
  const left = normalizeTaskTitle(a);
  const right = normalizeTaskTitle(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const aGrams = bigrams(left);
  const bGrams = bigrams(right);
  if (aGrams.size === 0 || bGrams.size === 0) {
    return left === right ? 1 : 0;
  }

  let intersection = 0;
  for (const [gram, count] of aGrams) {
    const other = bGrams.get(gram);
    if (other) intersection += Math.min(count, other);
  }

  let aTotal = 0;
  for (const count of aGrams.values()) aTotal += count;
  let bTotal = 0;
  for (const count of bGrams.values()) bTotal += count;

  return (2 * intersection) / (aTotal + bTotal);
}

export function areTitlesSimilar(
  a: string,
  b: string,
  threshold = TITLE_SIMILARITY_THRESHOLD,
): boolean {
  return titleSimilarity(a, b) >= threshold;
}

export interface SimilarTaskGroup<T extends { id: string; title: string }> {
  id: string;
  label: string;
  tasks: T[];
}

/**
 * Greedy clustering: assign each task to the first group whose
 * representative title is similar enough. Only returns groups with 2+ tasks.
 */
export function groupSimilarTasksByTitle<
  T extends { id: string; title: string },
>(tasks: T[], threshold = TITLE_SIMILARITY_THRESHOLD): SimilarTaskGroup<T>[] {
  const groups: SimilarTaskGroup<T>[] = [];

  for (const task of tasks) {
    let placed = false;
    for (const group of groups) {
      const representative = group.tasks[0];
      if (areTitlesSimilar(task.title, representative.title, threshold)) {
        group.tasks.push(task);
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push({
        id: task.id,
        label: task.title,
        tasks: [task],
      });
    }
  }

  return groups
    .filter((group) => group.tasks.length >= 2)
    .map((group) => ({
      ...group,
      label: group.tasks[0]?.title ?? group.label,
    }));
}

export function pickDefaultMergeTargetId<
  T extends { id: string; isCompleted?: boolean },
>(tasks: T[]): string {
  const completed = tasks.find((task) => Boolean(task.isCompleted));
  return completed?.id ?? tasks[0]?.id ?? '';
}
