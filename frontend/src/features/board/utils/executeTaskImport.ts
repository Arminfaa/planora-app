import { labelService } from '@/features/labels/services/label.service';
import type { ProjectLabel } from '@/features/labels/types';
import { checklistService } from '@/features/tasks/services/checklist.service';
import { taskService } from '@/features/tasks/services/task.service';
import type { ParsedImportRow } from './importTaskParser';
import { toCreateTaskInput } from './importTaskParser';

export interface ImportExecutionOptions {
  boardId: string;
  projectId: string;
  rows: ParsedImportRow[];
  projectLabels: ProjectLabel[];
  canCreateLabels: boolean;
  canEditTasks: boolean;
  onProgress: (completed: number, total: number) => void;
}

export interface ImportRowResult {
  rowIndex: number;
  title: string;
  success: boolean;
  error?: string;
}

export interface ImportExecutionResult {
  imported: number;
  failed: number;
  results: ImportRowResult[];
}

async function resolveLabelIds(
  names: string[],
  projectId: string,
  projectLabels: ProjectLabel[],
  canCreateLabels: boolean,
): Promise<string[]> {
  const labelIds: string[] = [];
  const labelMap = new Map(
    projectLabels.map((label) => [label.name.toLowerCase(), label]),
  );

  for (const name of names) {
    const existing = labelMap.get(name.toLowerCase());
    if (existing) {
      labelIds.push(existing.id);
      continue;
    }

    if (!canCreateLabels) continue;

    const created = await labelService.create(projectId, { name });
    labelMap.set(name.toLowerCase(), created);
    labelIds.push(created.id);
  }

  return labelIds;
}

export async function executeTaskImport({
  boardId,
  projectId,
  rows,
  projectLabels,
  canCreateLabels,
  canEditTasks,
  onProgress,
}: ImportExecutionOptions): Promise<ImportExecutionResult> {
  const validRows = rows.filter((row) => row.errors.length === 0);
  const results: ImportRowResult[] = [];
  let imported = 0;
  let failed = 0;
  let completed = 0;

  for (const row of validRows) {
    try {
      const task = await taskService.createOnBoard(
        boardId,
        toCreateTaskInput(row),
      );

      if (canEditTasks && (row.isCompleted || row.completeDate)) {
        await taskService.update(task.id, {
          isCompleted: true,
          progress: 100,
          ...(row.completeDate ? { completeDate: row.completeDate } : {}),
        });
      }

      if (row.labelNames?.length) {
        const labelIds = await resolveLabelIds(
          row.labelNames,
          projectId,
          projectLabels,
          canCreateLabels,
        );

        for (const labelId of labelIds) {
          await labelService.assign(task.id, labelId);
        }
      }

      if (row.checklistItems?.length) {
        for (const item of row.checklistItems) {
          const created = await checklistService.create(task.id, {
            title: item.title,
          });
          if (item.isDone) {
            await checklistService.update(task.id, created.id, {
              isDone: true,
            });
          }
        }
      }

      imported += 1;
      results.push({
        rowIndex: row.rowIndex,
        title: row.title,
        success: true,
      });
    } catch (error) {
      failed += 1;
      results.push({
        rowIndex: row.rowIndex,
        title: row.title,
        success: false,
        error:
          error instanceof Error ? error.message : 'Import failed for this row',
      });
    } finally {
      completed += 1;
      onProgress(completed, validRows.length);
    }
  }

  return { imported, failed, results };
}
