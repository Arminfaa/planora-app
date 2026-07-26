'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Dropdown, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { attachmentService } from '../services/attachment.service';
import type { TaskAttachment } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { TrashIcon } from '@/shared/components/icons/TrashIcon';
import { IconActionButton } from '@/shared/components/ui/IconActionButton';
import { Input } from '@/shared/components/ui/Input';
import { getApiErrorMessage } from '@/lib/api';
import { copyText } from '@/lib/copyText';
import { getAssetUrl, isImageAttachment } from '@/lib/assets';
import { AssetImage } from '@/shared/components/ui/AssetImage';
import { formatFileSize, isWebAttachmentUrl } from '../utils/format';

export interface TaskAttachmentsHandle {
  persist: () => Promise<void>;
}

interface DraftAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: TaskAttachment['type'];
  isNew?: boolean;
  isDeleted?: boolean;
  file?: File;
  previewUrl?: string;
}

interface TaskAttachmentsProps {
  taskId: string;
  mode?: 'immediate' | 'draft';
}

function createTempAttachmentId(): string {
  return `temp-attachment-${crypto.randomUUID()}`;
}

function inferAttachmentType(mimeType: string): TaskAttachment['type'] {
  return mimeType.startsWith('image/') ? 'IMAGE' : 'FILE';
}

function normalizeLinkUrl(raw: string): string {
  return raw.trim();
}

function isValidLinkValue(value: string): boolean {
  if (!value) return false;
  if (!/^https?:\/\//i.test(value)) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function deriveLinkFilename(url: string): string {
  try {
    const parsed = new URL(url);
    const path =
      parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
    return `${parsed.hostname}${path}`.slice(0, 255);
  } catch {
    return url.slice(0, 255);
  }
}

export const TaskAttachments = forwardRef<
  TaskAttachmentsHandle,
  TaskAttachmentsProps
>(function TaskAttachments({ taskId, mode = 'immediate' }, ref) {
  const { t } = useLocale();
  const isDraft = mode === 'draft';
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<DraftAttachment[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkError, setLinkError] = useState('');
  const [copiedPathId, setCopiedPathId] = useState<string | null>(null);

  const loadAttachments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await attachmentService.list(taskId);
      setAttachments(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  const previewUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  useEffect(() => {
    const previewUrls = previewUrlsRef;
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      persist: async () => {
        if (!isDraft) return;

        const deleted = attachments.filter(
          (attachment) => attachment.isDeleted && !attachment.isNew,
        );
        const created = attachments.filter(
          (attachment) =>
            attachment.isNew &&
            !attachment.isDeleted &&
            (attachment.file || attachment.type === 'LINK'),
        );

        for (const attachment of deleted) {
          await attachmentService.remove(taskId, attachment.id);
        }
        for (const attachment of created) {
          if (attachment.file) {
            await attachmentService.upload(taskId, attachment.file);
          } else if (attachment.type === 'LINK') {
            await attachmentService.createLink(
              taskId,
              attachment.url,
              attachment.filename,
            );
          }
        }
      },
    }),
    [attachments, isDraft, taskId],
  );

  const visibleAttachments = attachments.filter(
    (attachment) => !attachment.isDeleted,
  );

  const handleUpload = async (file: File) => {
    setError('');

    if (isDraft) {
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);
      setAttachments((current) => [
        ...current,
        {
          id: createTempAttachmentId(),
          filename: file.name,
          url: previewUrl,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          type: inferAttachmentType(file.type),
          isNew: true,
          file,
          previewUrl,
        },
      ]);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      return;
    }

    setIsUploading(true);
    try {
      await attachmentService.upload(taskId, file);
      await loadAttachments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleAddLink = async () => {
    const url = normalizeLinkUrl(linkValue);
    if (!isValidLinkValue(url)) {
      setLinkError(t('attachments.linkInvalid'));
      return;
    }

    setLinkError('');
    setError('');

    if (isDraft) {
      setAttachments((current) => [
        ...current,
        {
          id: createTempAttachmentId(),
          filename: deriveLinkFilename(url),
          url,
          mimeType: 'text/uri-list',
          size: 0,
          type: 'LINK',
          isNew: true,
        },
      ]);
      setLinkValue('');
      setShowLinkInput(false);
      return;
    }

    setIsUploading(true);
    try {
      await attachmentService.createLink(taskId, url);
      setLinkValue('');
      setShowLinkInput(false);
      await loadAttachments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyPath = async (attachmentId: string, path: string) => {
    const ok = await copyText(path);
    if (!ok) return;
    setCopiedPathId(attachmentId);
    window.setTimeout(() => {
      setCopiedPathId((current) => (current === attachmentId ? null : current));
    }, 2000);
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm(t('attachments.deleteConfirm'))) return;

    setError('');

    if (isDraft) {
      setAttachments((current) =>
        current
          .map((attachment) => {
            if (attachment.id !== attachmentId) return attachment;
            if (attachment.previewUrl) {
              URL.revokeObjectURL(attachment.previewUrl);
            }
            return { ...attachment, isDeleted: true };
          })
          .filter((attachment) => !(attachment.isNew && attachment.isDeleted)),
      );
      return;
    }

    try {
      await attachmentService.remove(taskId, attachmentId);
      await loadAttachments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const menuItems: MenuProps['items'] = [
    { key: 'file', label: t('attachments.addFile') },
    { key: 'link', label: t('attachments.addLink') },
  ];

  const onMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'file') {
      setShowLinkInput(false);
      setLinkError('');
      inputRef.current?.click();
      return;
    }
    if (key === 'link') {
      setShowLinkInput((current) => !current);
      setLinkError('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('attachments.title')}
        </h3>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.zip"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          <Dropdown
            menu={{ items: menuItems, onClick: onMenuClick }}
            trigger={['click']}
            placement="bottomRight"
            disabled={isUploading}
          >
            <span className="inline-flex">
              <IconActionButton
                label={t('attachments.add')}
                tone="primary"
                disabled={isUploading}
              >
                <PlusIcon className="h-4 w-4" />
              </IconActionButton>
            </span>
          </Dropdown>
        </div>
      </div>

      {showLinkInput && (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Input
              value={linkValue}
              onChange={(event) => {
                setLinkValue(event.target.value);
                if (linkError) setLinkError('');
              }}
              onPressEnter={() => void handleAddLink()}
              placeholder={t('attachments.linkPlaceholder')}
              error={linkError || undefined}
              disabled={isUploading}
              autoFocus
            />
          </div>
          <button
            type="button"
            disabled={isUploading || !linkValue.trim()}
            onClick={() => void handleAddLink()}
            className="mt-0.5 shrink-0 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('attachments.linkAdd')}
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">
          {t('attachments.loadingAttachments')}
        </p>
      ) : visibleAttachments.length === 0 ? (
        <p className="text-sm text-gray-500">
          {t('attachments.noAttachments')}
        </p>
      ) : (
        <div className="space-y-2">
          {visibleAttachments.map((attachment) => {
            const isLink = attachment.type === 'LINK';
            const isWebLink = isLink && isWebAttachmentUrl(attachment.url);
            const isFolderPath = isLink && !isWebLink;
            const assetUrl = isLink
              ? attachment.url
              : (attachment.previewUrl ?? getAssetUrl(attachment.url));
            const isImage =
              !isLink &&
              isImageAttachment(attachment.type, attachment.mimeType);
            const pathCopied = copiedPathId === attachment.id;

            return (
              <div
                key={attachment.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3"
              >
                <div className="min-w-0 flex-1">
                  {isImage ? (
                    <a
                      href={assetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block"
                    >
                      <AssetImage
                        src={assetUrl}
                        alt={attachment.filename}
                        width={800}
                        height={600}
                        resolveAsset={false}
                        className="max-h-48 w-full max-w-full rounded-md border border-gray-200 bg-white object-contain"
                        style={{
                          width: 'auto',
                          height: 'auto',
                          maxHeight: '12rem',
                        }}
                      />
                    </a>
                  ) : isWebLink ? (
                    <Tooltip title={attachment.url}>
                      <a
                        href={assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-full truncate text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {attachment.filename}
                      </a>
                    </Tooltip>
                  ) : isFolderPath ? (
                    <Tooltip title={attachment.url}>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyPath(attachment.id, attachment.url)
                        }
                        className="block max-w-full truncate text-start text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {attachment.filename}
                      </button>
                    </Tooltip>
                  ) : (
                    <Tooltip title={attachment.filename}>
                      <a
                        href={assetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block max-w-full truncate text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {attachment.filename}
                      </a>
                    </Tooltip>
                  )}
                  {isLink ? (
                    <Tooltip title={attachment.url}>
                      <p className="mt-1 max-w-full truncate text-xs text-gray-500">
                        {isFolderPath
                          ? `${t('attachments.folderPathLabel')} · ${attachment.url}`
                          : `${t('attachments.linkLabel')} · ${attachment.url}`}
                      </p>
                    </Tooltip>
                  ) : (
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {attachment.filename} · {formatFileSize(attachment.size)}
                    </p>
                  )}
                  {isFolderPath && (
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyPath(attachment.id, attachment.url)
                      }
                      className="mt-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      {pathCopied
                        ? t('attachments.pathCopied')
                        : t('attachments.copyPath')}
                    </button>
                  )}
                </div>
                <IconActionButton
                  label={t('common.delete')}
                  tone="danger"
                  onClick={() => void handleDelete(attachment.id)}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </IconActionButton>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
