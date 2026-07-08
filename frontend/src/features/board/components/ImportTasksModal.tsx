'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Progress } from 'antd';
import type { ProjectMember } from '@/features/projects/types';
import type { ProjectLabel } from '@/features/labels/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';
import { SelectField } from '@/shared/components/ui/SelectField';
import { getPriorityStyles } from '@/features/tasks/types';
import {
  extractSheetData,
  parseExcelFile,
} from '../utils/parseExcelFile';
import {
  IGNORE_COLUMN_VALUE,
  buildDefaultAssigneeValueMapping,
  buildDefaultStatusValueMapping,
  buildImportPreview,
  getAssigneeValueMappingOptions,
  getImportFieldDefinitions,
  getStatusValueMappingOptions,
  getUniqueAssigneeTokens,
  getUniqueColumnValues,
  type AssigneeValueMapping,
  type ColumnMapping,
  type ImportPreviewResult,
  type StatusValueMapping,
} from '../utils/importTaskParser';
import { executeTaskImport } from '../utils/executeTaskImport';

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

interface ImportTasksModalProps {
  boardId: string;
  projectId: string;
  members: ProjectMember[];
  projectLabels: ProjectLabel[];
  canCreateLabels: boolean;
  canEditTasks: boolean;
  onClose: () => void;
  onImported: () => Promise<void>;
}

const ACCEPTED_EXTENSIONS = '.xlsx,.xls';
const HEADER_PREVIEW_ROWS = 8;

export function ImportTasksModal({
  boardId,
  projectId,
  members,
  projectLabels,
  canCreateLabels,
  canEditTasks,
  onClose,
  onImported,
}: ImportTasksModalProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>('upload');
  const [fileName, setFileName] = useState('');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [headerLabels, setHeaderLabels] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [statusValueMapping, setStatusValueMapping] =
    useState<StatusValueMapping>({});
  const [assigneeValueMapping, setAssigneeValueMapping] =
    useState<AssigneeValueMapping>({});
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [error, setError] = useState('');
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importSummary, setImportSummary] = useState({
    imported: 0,
    failed: 0,
  });

  const fieldDefinitions = useMemo(
    () => getImportFieldDefinitions(t),
    [t],
  );
  const priorityLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(getPriorityStyles(t)).map(([key, value]) => [
          key,
          value.label,
        ]),
      ) as Record<
        import('@/features/tasks/types').TaskPriority,
        string
      >,
    [t],
  );

  const excelColumnOptions = useMemo(
    () => [
      { value: String(IGNORE_COLUMN_VALUE), label: t('import.ignoreColumn') },
      ...headerLabels.map((label, index) => ({
        value: String(index),
        label,
      })),
    ],
    [headerLabels, t],
  );

  const statusValueOptions = useMemo(
    () => getStatusValueMappingOptions(t),
    [t],
  );

  const assigneeValueOptions = useMemo(
    () => getAssigneeValueMappingOptions(members, t),
    [members, t],
  );

  const headerRowOptions = useMemo(
    () =>
      rawRows.map((_, index) => ({
        value: String(index),
        label: t('import.headerRowOption', { number: index + 1 }),
      })),
    [rawRows, t],
  );

  const applyHeaderRow = useCallback(
    (nextRawRows: string[][], nextHeaderRowIndex: number) => {
      const extracted = extractSheetData(
        nextRawRows,
        nextHeaderRowIndex,
        t('import.emptyHeader'),
      );

      setHeaderLabels(extracted.headerLabels);
      setRows(extracted.rows);
    },
    [t],
  );

  const handleHeaderRowChange = (value: string) => {
    const nextIndex = Number(value);
    if (Number.isNaN(nextIndex) || nextIndex < 0 || nextIndex >= rawRows.length) {
      return;
    }

    setHeaderRowIndex(nextIndex);
    setColumnMapping({});
    setStatusValueMapping({});
    setAssigneeValueMapping({});
    setPreview(null);
    applyHeaderRow(rawRows, nextIndex);
  };

  const titleMapped =
    columnMapping.title != null && columnMapping.title >= 0;

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setError('');
    try {
      const parsed = await parseExcelFile(file);
      setFileName(file.name);
      setRawRows(parsed.rawRows);
      setHeaderRowIndex(0);
      setColumnMapping({});
      setStatusValueMapping({});
      setAssigneeValueMapping({});
      setPreview(null);
      applyHeaderRow(parsed.rawRows, 0);
      setStep('mapping');
    } catch (parseError) {
      const code =
        parseError instanceof Error ? parseError.message : 'parse';
      const messageKey =
        code === 'empty' ||
        code === 'noRows' ||
        code === 'parse' ||
        code === 'read'
          ? (`import.errors.${code}` as const)
          : 'import.errors.parse';
      setError(t(messageKey));
    }
  };

  const handleMappingFieldChange = (
    fieldKey: keyof ColumnMapping,
    value: string,
  ) => {
    const columnIndex = Number(value);

    setColumnMapping((current) => {
      const next = { ...current };
      if (columnIndex === IGNORE_COLUMN_VALUE || Number.isNaN(columnIndex)) {
        delete next[fieldKey];
      } else {
        next[fieldKey] = columnIndex;
      }
      return next;
    });
    setPreview(null);
  };

  const initializeValueMappings = useCallback(() => {
    let nextStatusValueMapping: StatusValueMapping = {};
    let nextAssigneeValueMapping: AssigneeValueMapping = {};

    if (columnMapping.status != null) {
      const uniqueValues = getUniqueColumnValues(rows, columnMapping.status);
      nextStatusValueMapping = buildDefaultStatusValueMapping(uniqueValues);
      setStatusValueMapping(nextStatusValueMapping);
    } else {
      setStatusValueMapping({});
    }

    if (columnMapping.assignees != null) {
      const uniqueTokens = getUniqueAssigneeTokens(
        rows,
        columnMapping.assignees,
      );
      nextAssigneeValueMapping = buildDefaultAssigneeValueMapping(
        uniqueTokens,
        members,
      );
      setAssigneeValueMapping(nextAssigneeValueMapping);
    } else {
      setAssigneeValueMapping({});
    }

    return {
      statusValueMapping: nextStatusValueMapping,
      assigneeValueMapping: nextAssigneeValueMapping,
    };
  }, [columnMapping.assignees, columnMapping.status, members, rows]);

  const handleGoToPreview = () => {
    if (!titleMapped) {
      setError(t('import.titleMappingRequired'));
      return;
    }

    if (rows.length === 0) {
      setError(t('import.errors.noRows'));
      return;
    }

    setError('');
    const mappings = initializeValueMappings();
    const previewResult = buildImportPreview({
      rows,
      columnMapping,
      statusValueMapping: mappings.statusValueMapping,
      assigneeValueMapping: mappings.assigneeValueMapping,
      members,
      priorityLabels,
      t,
    });

    setPreview(previewResult);
    setStep('preview');
  };

  const refreshPreview = () => {
    const previewResult = buildImportPreview({
      rows,
      columnMapping,
      statusValueMapping,
      assigneeValueMapping,
      members,
      priorityLabels,
      t,
    });
    setPreview(previewResult);
  };

  const handleImport = async () => {
    const freshPreview = buildImportPreview({
      rows,
      columnMapping,
      statusValueMapping,
      assigneeValueMapping,
      members,
      priorityLabels,
      t,
    });

    setPreview(freshPreview);

    if (freshPreview.validCount === 0) {
      setError(t('import.errorCount', { count: freshPreview.errorCount }));
      return;
    }

    setStep('importing');
    setImportProgress({ done: 0, total: freshPreview.validCount });
    setError('');

    try {
      const result = await executeTaskImport({
        boardId,
        projectId,
        rows: freshPreview.rows,
        projectLabels,
        canCreateLabels,
        canEditTasks,
        onProgress: (done, total) => setImportProgress({ done, total }),
      });

      setImportSummary({
        imported: result.imported,
        failed: result.failed,
      });
      setStep('done');
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : t('import.importFailed'),
      );
      setStep('preview');
    }
  };

  const stepTitle = useMemo(() => {
    switch (step) {
      case 'upload':
        return t('import.stepUpload');
      case 'mapping':
        return t('import.stepMapping');
      case 'preview':
        return t('import.stepPreview');
      case 'importing':
        return t('import.stepImporting');
      case 'done':
        return t('import.stepDone');
      default:
        return t('import.title');
    }
  }, [step, t]);

  const footer = useMemo(() => {
    if (step === 'upload') {
      return (
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={() => fileInputRef.current?.click()}>
            {t('import.chooseFile')}
          </Button>
        </div>
      );
    }

    if (step === 'mapping') {
      return (
        <div className="flex justify-between gap-2">
          <Button onClick={() => setStep('upload')}>{t('common.back')}</Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              type="primary"
              disabled={!titleMapped || rows.length === 0}
              onClick={handleGoToPreview}
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      );
    }

    if (step === 'preview') {
      return (
        <div className="flex justify-between gap-2">
          <Button onClick={() => setStep('mapping')}>{t('common.back')}</Button>
          <div className="flex gap-2">
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              type="primary"
              disabled={!preview || preview.validCount === 0}
              onClick={() => void handleImport()}
            >
              {t('import.importRows', { count: preview?.validCount ?? 0 })}
            </Button>
          </div>
        </div>
      );
    }

    if (step === 'importing') {
      return null;
    }

    return (
      <div className="flex justify-end">
        <Button
          type="primary"
          onClick={() => {
            void onImported().finally(() => onClose());
          }}
        >
          {t('common.done')}
        </Button>
      </div>
    );
  }, [
    handleGoToPreview,
    handleImport,
    onClose,
    onImported,
    preview,
    rows.length,
    step,
    t,
    titleMapped,
  ]);

  return (
    <AppModal
      title={t('import.title')}
      subtitle={stepTitle}
      open
      onClose={onClose}
      width={step === 'preview' ? 920 : 720}
      footer={footer}
      maskClosable={step !== 'importing'}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(event) => void handleFileChange(event)}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t('import.uploadHint')}</p>
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-900">
              {t('import.dropOrChoose')}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('import.supportedFormats')}
            </p>
            <Button
              className="mt-4"
              type="primary"
              onClick={() => fileInputRef.current?.click()}
            >
              {t('import.chooseFile')}
            </Button>
          </div>
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <span className="font-medium">{fileName}</span>
            <span className="mx-2 text-gray-400">·</span>
            {t('import.rowCount', { count: rows.length })}
          </div>

          <p className="text-sm text-gray-600">{t('import.mappingHint')}</p>

          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {t('import.unspecifiedColumnNote')}
          </div>

          <SelectField
            label={t('import.headerRow')}
            value={String(headerRowIndex)}
            onChange={(value) => handleHeaderRowChange(String(value))}
            options={headerRowOptions}
          />
          <p className="-mt-2 text-xs text-gray-500">
            {t('import.headerRowHint')}
          </p>

          <div className="max-h-40 overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-xs">
              <tbody>
                {rawRows.slice(0, HEADER_PREVIEW_ROWS).map((row, rowIndex) => (
                  <tr
                    key={`preview-row-${rowIndex}`}
                    className={
                      rowIndex === headerRowIndex
                        ? 'bg-primary-50 font-medium text-primary-900'
                        : 'bg-white text-gray-700'
                    }
                  >
                    <td className="w-14 shrink-0 border-b border-gray-100 px-2 py-1.5 text-gray-500">
                      {rowIndex + 1}
                    </td>
                    {row.slice(0, 6).map((cell, cellIndex) => (
                      <td
                        key={`preview-cell-${rowIndex}-${cellIndex}`}
                        className="max-w-[140px] truncate border-b border-gray-100 px-2 py-1.5"
                      >
                        {cell || t('import.emptyValue')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            {fieldDefinitions.map((field) => (
              <SelectField
                key={field.key}
                label={
                  <span>
                    {field.label}
                    {field.required && (
                      <span className="ms-1 text-red-500">*</span>
                    )}
                  </span>
                }
                value={String(
                  columnMapping[field.key] ?? IGNORE_COLUMN_VALUE,
                )}
                onChange={(value) =>
                  handleMappingFieldChange(field.key, String(value))
                }
                options={excelColumnOptions}
                showSearch
                optionFilterProp="label"
              />
            ))}
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              {t('import.readyCount', { count: preview.validCount })}
            </div>
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              {t('import.errorCount', { count: preview.errorCount })}
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t('import.warningCount', { count: preview.warningCount })}
            </div>
          </div>

          {columnMapping.assignees != null && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('import.assigneeValueMappingTitle')}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t('import.assigneeValueMappingHint')}
              </p>
              <div className="mt-3 space-y-2">
                {Object.entries(assigneeValueMapping).map(
                  ([excelValue, memberId]) => (
                    <div
                      key={`assignee-${excelValue || '__empty__'}`}
                      className="grid gap-2 sm:grid-cols-2 sm:items-center"
                    >
                      <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        {excelValue || t('import.emptyValue')}
                      </div>
                      <SelectField
                        value={memberId}
                        onChange={(value) => {
                          setAssigneeValueMapping((current) => ({
                            ...current,
                            [excelValue]: String(value),
                          }));
                        }}
                        options={assigneeValueOptions}
                        showSearch
                        optionFilterProp="label"
                      />
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {columnMapping.status != null && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('import.statusValueMappingTitle')}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t('import.statusValueMappingHint')}
              </p>
              <div className="mt-3 space-y-2">
                {Object.entries(statusValueMapping).map(([excelValue, target]) => (
                  <div
                    key={`status-${excelValue || '__empty__'}`}
                    className="grid gap-2 sm:grid-cols-2 sm:items-center"
                  >
                    <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {excelValue || t('import.emptyValue')}
                    </div>
                    <SelectField
                      value={target}
                      onChange={(value) => {
                        setStatusValueMapping((current) => ({
                          ...current,
                          [excelValue]: value as 'completed' | 'not_completed',
                        }));
                      }}
                      options={statusValueOptions}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={refreshPreview}>{t('import.refreshPreview')}</Button>
          </div>

          <div className="max-h-[320px] overflow-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-start font-medium text-gray-600">
                    #
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-gray-600">
                    {t('export.columns.title')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-gray-600">
                    {t('export.columns.dueDate')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-gray-600">
                    {t('export.columns.assignees')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-gray-600">
                    {t('common.status')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-gray-600">
                    {t('import.previewResult')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {preview.rows.slice(0, 20).map((row) => (
                  <tr key={row.rowIndex}>
                    <td className="px-3 py-2 text-gray-500">{row.rowIndex}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {row.title || t('common.emDash')}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.dueDate || t('common.emDash')}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.assigneeNames?.join(', ') || t('common.emDash')}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.isCompleted == null
                        ? t('common.emDash')
                        : row.isCompleted
                          ? t('export.statusCompleted')
                          : t('export.statusNotCompleted')}
                    </td>
                    <td className="px-3 py-2">
                      {row.errors.length > 0 ? (
                        <span className="text-red-600">
                          {row.errors.join(' · ')}
                        </span>
                      ) : row.warnings.length > 0 ? (
                        <span className="text-amber-700">
                          {row.warnings.join(' · ')}
                        </span>
                      ) : (
                        <span className="text-green-700">
                          {t('import.rowReady')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.rows.length > 20 && (
            <p className="text-xs text-gray-500">
              {t('import.previewLimited', { count: preview.rows.length })}
            </p>
          )}
        </div>
      )}

      {step === 'importing' && (
        <div className="space-y-4 py-6">
          <p className="text-sm text-gray-700">{t('import.importingHint')}</p>
          <Progress
            percent={
              importProgress.total > 0
                ? Math.round((importProgress.done / importProgress.total) * 100)
                : 0
            }
            status="active"
          />
          <p className="text-sm text-gray-500">
            {t('import.importProgress', {
              done: importProgress.done,
              total: importProgress.total,
            })}
          </p>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-3 py-4">
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            {t('import.importSuccess', { count: importSummary.imported })}
          </div>
          {importSummary.failed > 0 && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              {t('import.importFailedCount', { count: importSummary.failed })}
            </div>
          )}
        </div>
      )}
    </AppModal>
  );
}
