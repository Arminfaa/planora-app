'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { copyText } from '@/lib/copyText';
import {
  formatDateSeparator,
  formatMessageTime,
  getMessageDateKey,
} from '../utils/formatDateTime';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { TextArea } from '@/shared/components/ui/TextArea';
import { getApiErrorMessage } from '@/lib/api';
import { getAssetUrl } from '@/lib/assets';
import { AssetImage } from '@/shared/components/ui/AssetImage';
import { useProjectGroup } from '../hooks/useProjectGroup';
import { formatActivityMessage } from '../utils/formatActivity';
import { formatMessageText } from '../utils/formatMessageText';
import { getTaskActivityHref } from '../utils/getTaskActivityHref';
import type { ProjectGroupAuthor, ProjectGroupMessage } from '../types';

interface ProjectGroupPanelProps {
  projectId: string;
  projectSlug: string;
  canView: boolean;
  canSend: boolean;
  canUpload: boolean;
  canDeleteAny: boolean;
  fullHeight?: boolean;
}

type ChatFeedItem =
  | { kind: 'date'; date: string; key: string }
  | { kind: 'message'; message: ProjectGroupMessage; key: string };

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function UserAvatar({
  author,
  size = 'md',
}: {
  author: ProjectGroupAuthor | null;
  size?: 'sm' | 'md';
}) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs';
  const name = author?.name ?? '?';
  const avatarUrl = author?.avatar ? getAssetUrl(author.avatar) : null;

  if (avatarUrl) {
    const pixelSize = size === 'sm' ? 28 : 32;

    return (
      <AssetImage
        src={avatarUrl}
        alt={name}
        width={pixelSize}
        height={pixelSize}
        resolveAsset={false}
        className={`${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 font-semibold text-white`}
    >
      {getInitials(name)}
    </span>
  );
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="py-2 text-center">
      <span className="text-xs font-medium text-gray-400">
        {formatDateSeparator(date)}
      </span>
    </div>
  );
}

function ActivityLogItem({
  message,
  projectSlug,
}: {
  message: ProjectGroupMessage;
  projectSlug: string;
}) {
  const activity = formatActivityMessage(message);
  const taskHref = getTaskActivityHref(message, projectSlug);

  const pillContent = (
    <p className="text-xs leading-relaxed text-gray-600">{activity.title}</p>
  );

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="max-w-[90%] rounded-full bg-gray-100 px-4 py-2 text-center">
        {taskHref ? (
          <Link
            href={taskHref}
            className="block transition hover:text-primary-700"
          >
            {pillContent}
          </Link>
        ) : (
          pillContent
        )}
      </div>
      {activity.detailRows.length > 0 && (
        <div className="flex max-w-[90%] flex-col items-center gap-1.5">
          {activity.detailRows.map((row, index) => (
            <div
              key={`${message.id}-detail-${index}`}
              className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-500"
            >
              {row.prefix && <span>{row.prefix}</span>}
              {row.badge && (
                <span className="inline-flex items-center rounded-md bg-amber-900 px-2 py-0.5 text-[11px] font-medium text-white">
                  {row.badge}
                </span>
              )}
              {row.text && !row.badge && <span>{row.text}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyMessageButton({ text }: { text: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyText(text);
    if (!success) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={copied ? t('common.copied') : t('group.copyMessage')}
      aria-label={copied ? t('common.copied') : t('group.copyMessage')}
      className="rounded-md p-1 text-gray-400 transition hover:bg-white/70 hover:text-gray-600 sm:opacity-0 sm:group-hover/bubble:opacity-100"
    >
      {copied ? (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

function GroupMessageItem({
  message,
  projectSlug,
  currentUserId,
  canDeleteAny,
  onEdit,
  onDelete,
}: {
  message: ProjectGroupMessage;
  projectSlug: string;
  currentUserId?: string;
  canDeleteAny: boolean;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}) {
  const { t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwn = message.author?.id === currentUserId;
  const canDelete = message.type === 'USER' && (isOwn || canDeleteAny);
  const canEdit =
    message.type === 'USER' && isOwn && message.canEdit && !isEditing;

  if (message.type === 'ACTIVITY') {
    return <ActivityLogItem message={message} projectSlug={projectSlug} />;
  }

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onEdit(message.id, editContent.trim());
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bubbleClass = isOwn
    ? 'bg-primary-100 text-gray-900'
    : 'bg-gray-100 text-gray-900';

  return (
    <div
      className={`flex w-full py-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`group flex min-w-0 max-w-[85%] gap-2.5 sm:max-w-[75%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div className="flex shrink-0 items-end pb-5">
          <UserAvatar author={message.author} />
        </div>

        <div
          className={`flex min-w-0 flex-1 flex-col ${isOwn ? 'items-end' : 'items-start'}`}
        >
          <p className="mb-1 px-1 text-[11px] font-medium text-gray-400">
            {message.author?.name ?? t('group.unknownAuthor')}
          </p>

          {isEditing ? (
            <div className="w-full min-w-[16rem] space-y-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
              <TextArea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => void handleSaveEdit()}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-xs"
                >
                  {t('common.save')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content ?? '');
                  }}
                  className="px-3 py-1 text-xs"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`group/bubble relative min-w-0 max-w-[min(72vw,18rem)] rounded-2xl px-3.5 pt-2.5 pb-6 sm:max-w-[min(100%,24rem)] ${bubbleClass}`}
            >
              {message.content && (
                <p className="whitespace-pre-wrap break-words pe-8 text-sm leading-relaxed [overflow-wrap:anywhere]">
                  {formatMessageText(message.content)}
                </p>
              )}
              {message.content && (
                <div className="absolute end-2 top-2">
                  <CopyMessageButton text={message.content} />
                </div>
              )}
              {message.attachments.length > 0 && (
                <div className={`space-y-2 ${message.content ? 'mt-2' : ''}`}>
                  {message.attachments.map((attachment) =>
                    attachment.type === 'IMAGE' ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <AssetImage
                          src={attachment.url}
                          alt={attachment.filename}
                          width={400}
                          height={192}
                          resolveAsset={false}
                          className="max-h-48 rounded-xl object-cover"
                          style={{
                            width: 'auto',
                            height: 'auto',
                            maxHeight: '12rem',
                          }}
                        />
                      </a>
                    ) : (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-primary-600 hover:bg-white"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {attachment.filename}
                      </a>
                    ),
                  )}
                </div>
              )}
              <span className="absolute bottom-2 end-3 text-[10px] text-gray-400">
                {formatMessageTime(message.createdAt)}
                {message.editedAt && t('group.editedSuffix')}
              </span>
            </div>
          )}

          {(canEdit || canDelete) && !isEditing && (
            <div
              className={`mt-1 flex gap-2 px-1 opacity-0 transition group-hover:opacity-100 ${isOwn ? 'flex-row-reverse' : ''}`}
            >
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
                >
                  {t('common.edit')}
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => void onDelete(message.id)}
                  className="text-[11px] font-medium text-red-600 hover:text-red-700"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildChatFeedItems(messages: ProjectGroupMessage[]): ChatFeedItem[] {
  const items: ChatFeedItem[] = [];
  const seenMessageIds = new Set<string>();
  let lastDateKey = '';

  for (const message of messages) {
    if (seenMessageIds.has(message.id)) continue;
    seenMessageIds.add(message.id);

    const dateKey = getMessageDateKey(message.createdAt);
    if (dateKey !== lastDateKey) {
      items.push({
        kind: 'date',
        date: message.createdAt,
        key: `date-${dateKey}-${message.id}`,
      });
      lastDateKey = dateKey;
    }
    items.push({ kind: 'message', message, key: message.id });
  }

  return items;
}

export function ProjectGroupPanel({
  projectId,
  projectSlug,
  canView,
  canSend,
  canUpload,
  canDeleteAny,
  fullHeight = false,
}: ProjectGroupPanelProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [actionError, setActionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    messages,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    messagesEndRef,
    messagesContainerRef,
    sendMessage,
    uploadFile,
    updateMessage,
    deleteMessage,
    loadMore,
  } = useProjectGroup(projectId, { enabled: canView });

  const chatFeedItems = useMemo(() => buildChatFeedItems(messages), [messages]);

  if (!canView) {
    return (
      <section className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <p className="text-sm text-gray-500">{t('group.noViewPermission')}</p>
      </section>
    );
  }

  const handleSend = async () => {
    if (!content.trim() || !canSend) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await sendMessage(content.trim());
      setContent('');
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canUpload) return;
    setIsSubmitting(true);
    setActionError('');
    try {
      await uploadFile(file, content.trim() || undefined);
      setContent('');
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    setActionError('');
    try {
      await updateMessage(messageId, newContent);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
      throw err;
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm(t('group.deleteMessageConfirm'))) return;
    setActionError('');
    try {
      await deleteMessage(messageId);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${
        fullHeight ? 'min-h-0 flex-1' : ''
      }`}
    >
      <div className="shrink-0 border-b border-gray-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('group.title')}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {t('group.subtitleExtended')}
        </p>
      </div>

      <div
        className={`flex min-h-0 flex-col ${
          fullHeight ? 'flex-1' : 'h-[28rem]'
        }`}
      >
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-[#fafafa] px-4 py-4 sm:px-5 max-h-[calc(100dvh-290px)] sm:max-h-[calc(100dvh-260px)]"
        >
          {hasMore && (
            <div className="mb-4 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {isLoadingMore
                  ? t('common.loading')
                  : t('group.loadOlderMessages')}
              </button>
            </div>
          )}

          {(error || actionError) && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error || actionError}
            </div>
          )}

          {isLoading ? (
            <p className="text-center text-sm text-gray-500">
              {t('group.loadingMessages')}
            </p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              {t('group.noMessages')}
            </p>
          ) : (
            <div className="space-y-1">
              {chatFeedItems.map((item) =>
                item.kind === 'date' ? (
                  <DateSeparator key={item.key} date={item.date} />
                ) : (
                  <GroupMessageItem
                    key={item.key}
                    message={item.message}
                    projectSlug={projectSlug}
                    currentUserId={user?.id}
                    canDeleteAny={canDeleteAny}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ),
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {(canSend || canUpload) && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 py-4">
            <div className="flex flex-col sm:flex-row items-start gap-2">
              <TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  canSend
                    ? t('group.writeMessage')
                    : t('group.captionPlaceholder')
                }
                rows={2}
                disabled={!canSend && !canUpload}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && canSend) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="flex-1 resize-none w-full"
              />
              <div className="flex gap-2">
                {canUpload && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => void handleFileSelect(e)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isSubmitting}
                      onClick={() => fileInputRef.current?.click()}
                      title={t('group.uploadFile')}
                      className="px-2 py-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                    </Button>
                  </>
                )}
                {canSend && (
                  <Button
                    disabled={isSubmitting || !content.trim()}
                    onClick={() => void handleSend()}
                    className="px-5 py-2 text-sm"
                  >
                    {t('group.send')}
                  </Button>
                )}
              </div>
            </div>
            {canSend && (
              <p className="mt-2 text-xs text-gray-400">
                {t('group.editWindowHint')}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
