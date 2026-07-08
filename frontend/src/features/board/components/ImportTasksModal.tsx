'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Button, Progress } from 'antd';
import type { BoardColumn } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { ProjectLabel } from '@/features/labels/types';
import { useLocale } from '@/i18n/LocaleProvider';
import { AppModal } from '@/shared/components/ui/AppModal';
import { SelectField } from '@/shared/components/ui/SelectField';
import { getPriorityStyles } from '@/features/tasks/types';
import { parseExcelFile } from '../utils/parseExcelFile';
import {
  IGNORE_COLUMN_VALUE,
  buildDefaultColumnValueMapping,
  buildDefaultStatusValueMapping,
  buildImportPreview,
  getColumnValueMappingOptions,
  getImportFieldDefinitions,
  getStatusValueMappingOptions,
  getUniqueColumnValues,
  type ColumnMapping,
  type ColumnValueMapping,
  type ImportPreviewResult,
  type StatusValueMapping,
} from '../utils/importTaskParser';
import { executeTaskImport } from '../utils/executeTaskImport';

type WizardStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

interface ImportTasksModalProps {
  boardId: string;
  projectId: string;
  columns: BoardColumn[];
  members: ProjectMember[];
  projectLabels: ProjectLabel[];
  canCreateLabels: boolean;
  canEditTasks: boolean;
  onClose: () => void;
  onImported: () => Promise<void>;
}

const ACCEPTED_EXTENSIONS = '.xlsx,.xls';

export function ImportTasksModal({
  boardId,
  projectId,
  columns,
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
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [columnValueMapping, setColumnValueMapping] =
    useState<ColumnValueMapping>({});
  const [statusValueMapping, setStatusValueMapping] =
    useState<StatusValueMapping>({});
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
      { value: IGNORE_COLUMN_VALUE, label: t('import.ignoreColumn') },
      ...headers.map((header) => ({ value: header, label: header })),
    ],
    [headers, t],
  );

  const columnValueOptions = useMemo(
    () => getColumnValueMappingOptions(columns, t),
    [columns, t],
  );

  const statusValueOptions = useMemo(
    () => getStatusValueMappingOptions(t),
    [t],
  );

  const titleMapped = Boolean(
    columnMapping.title &&
      columnMapping.title !== IGNORE_COLUMN_VALUE &&
      headers.includes(columnMapping.title),
  );

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
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setColumnMapping({});
      setColumnValueMapping({});
      setStatusValueMapping({});
      setPreview(null);
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
    setColumnMapping((current) => {
      const next = { ...current };
      if (value === IGNORE_COLUMN_VALUE) {
        delete next[fieldKey];
      } else {
        next[fieldKey] = value;
      }
      return next;
    });
    setPreview(null);
  };

  const initializeValueMappings = useCallback(() => {
    let nextColumnValueMapping: ColumnValueMapping = {};
    let nextStatusValueMapping: StatusValueMapping = {};

    if (columnMapping.column) {
      const uniqueValues = getUniqueColumnValues(
        rows,
        headers,
        columnMapping.column,
      );
      nextColumnValueMapping = buildDefaultColumnValueMapping(
        uniqueValues,
        columns,
      );
    }

    if (columnMapping.status) {
      const uniqueValues = getUniqueColumnValues(
        rows,
        headers,
        columnMapping.status,
      );
      nextStatusValueMapping = buildDefaultStatusValueMapping(uniqueValues);
    }

    setColumnValueMapping(nextColumnValueMapping);
    setStatusValueMapping(nextStatusValueMapping);

    return {
      columnValueMapping: nextColumnValueMapping,
      statusValueMapping: nextStatusValueMapping,
    };
  }, [columnMapping.column, columnMapping.status, columns, headers, rows, t]);

  const handleGoToPreview = () => {
    if (!titleMapped) {
      setError(t('import.titleMappingRequired'));
      return;
    }

    setError('');
    const mappings = initializeValueMappings();
    const previewResult = buildImportPreview({
      rows,
      headers,
      columnMapping,
      columnValueMapping: mappings.columnValueMapping,
      statusValueMapping: mappings.statusValueMapping,
      columns,
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
      headers,
      columnMapping,
      columnValueMapping,
      statusValueMapping,
      columns,
      members,
      priorityLabels,
      t,
    });
    setPreview(previewResult);
  };

  const handleImport = async () => {
    const freshPreview = buildImportPreview({
      rows,
      headers,
      columnMapping,
      columnValueMapping,
      statusValueMapping,
      columns,
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
      await onImported();
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
            <Button type="primary" disabled={!titleMapped} onClick={handleGoToPreview}>
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
        <Button type="primary" onClick={onClose}>
          {t('common.done')}
        </Button>
      </div>
    );
  }, [
    handleGoToPreview,
    handleImport,
    onClose,
    preview,
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
                value={columnMapping[field.key] ?? IGNORE_COLUMN_VALUE}
                onChange={(value) =>
                  handleMappingFieldChange(field.key, String(value))
                }
                options={excelColumnOptions}
              />
            ))}
          </div>

          {(columnMapping.column || columnMapping.status) && (
            <p className="text-xs text-gray-500">
              {columnMapping.column && t('import.columnFieldHint')}
              {columnMapping.column && columnMapping.status && ' · '}
              {columnMapping.status && t('import.statusFieldHint')}
            </p>
          )}
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

          {columnMapping.column && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {t('import.columnValueMappingTitle')}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {t('import.columnValueMappingHint')}
              </p>
              <div className="mt-3 space-y-2">
                {Object.entries(columnValueMapping).map(([excelValue, target]) => (
                  <div
                    key={`column-${excelValue || '__empty__'}`}
                    className="grid gap-2 sm:grid-cols-2 sm:items-center"
                  >
                    <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {excelValue || t('import.emptyValue')}
                    </div>
                    <SelectField
                      value={target}
                      onChange={(value) => {
                        setColumnValueMapping((current) => ({
                          ...current,
                          [excelValue]: String(value),
                        }));
                      }}
                      options={columnValueOptions}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {columnMapping.status && (
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
                    {t('export.columns.column')}
                  </th>
                  <th className="px-3 py-2 text-start font-medium text-gray-600">
                    {t('export.columns.dueDate')}
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
                      {row.columnName || t('board.unspecifiedColumn')}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {row.dueDate || t('common.emDash')}
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
