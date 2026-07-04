'use client';

import { useRef, useState } from 'react';
import { formatMessageDateTime } from '../utils/formatDateTime';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';
import { useProjectGroup } from '../hooks/useProjectGroup';
import { formatActivityMessage } from '../utils/formatActivity';
import type { ProjectGroupMessage } from '../types';

interface ProjectGroupPanelProps {
  projectId: string;
  canView: boolean;
  canSend: boolean;
  canUpload: boolean;
  canDeleteAny: boolean;
}

function GroupMessageItem({
  message,
  currentUserId,
  canDeleteAny,
  onEdit,
  onDelete,
}: {
  message: ProjectGroupMessage;
  currentUserId?: string;
  canDeleteAny: boolean;
  onEdit: (messageId: string, content: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwn = message.author?.id === currentUserId;
  const canDelete = message.type === 'USER' && (isOwn || canDeleteAny);
  const canEdit =
    message.type === 'USER' && isOwn && message.canEdit && !isEditing;

  if (message.type === 'ACTIVITY') {
    const activity = formatActivityMessage(message);
    return (
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
        <p className="text-sm text-gray-800">{activity.title}</p>
        {activity.details.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {activity.details.map((detail) => (
              <li key={detail} className="text-xs text-gray-600">
                {detail}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1.5 text-xs text-gray-400">
          {formatMessageDateTime(message.createdAt)}
        </p>
      </div>
    );
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

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        isOwn
          ? 'ml-8 border-primary-200 bg-primary-50/60'
          : 'mr-8 border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-700">
            {message.author?.name ?? 'Unknown'}
          </p>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => void handleSaveEdit()}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-xs"
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content ?? '');
                  }}
                  className="px-3 py-1 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {message.content && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                  {message.content}
                </p>
              )}
              {message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) =>
                    attachment.type === 'IMAGE' ? (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="max-h-48 rounded-lg border border-gray-200 object-cover"
                        />
                      </a>
                    ) : (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-primary-600 hover:bg-gray-100"
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
            </>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          {formatMessageDateTime(message.createdAt)}
          {message.editedAt && ' (edited)'}
        </p>
        <div className="flex gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => void onDelete(message.id)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectGroupPanel({
  projectId,
  canView,
  canSend,
  canUpload,
  canDeleteAny,
}: ProjectGroupPanelProps) {
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
    sendMessage,
    uploadFile,
    updateMessage,
    deleteMessage,
    loadMore,
  } = useProjectGroup(projectId, { enabled: canView });

  if (!canView) {
    return (
      <section className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
        <p className="text-sm text-gray-500">
          You do not have permission to view the project group.
        </p>
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
    if (!confirm('Delete this message?')) return;
    setActionError('');
    try {
      await deleteMessage(messageId);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Project group</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Team chat, file sharing, and project activity log
        </p>
      </div>

      <div className="flex h-[28rem] flex-col">
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {hasMore && (
            <div className="mb-4 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : 'Load older messages'}
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
              Loading messages...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              No messages yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <GroupMessageItem
                  key={message.id}
                  message={message}
                  currentUserId={user?.id}
                  canDeleteAny={canDeleteAny}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {(canSend || canUpload) && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex gap-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  canSend ? 'Write a message...' : 'Add a caption (optional)...'
                }
                rows={2}
                disabled={!canSend && !canUpload}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && canSend) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-50"
              />
              <div className="flex flex-col gap-2">
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
                      title="Upload file"
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
                    className="px-3 py-2 text-sm"
                  >
                    Send
                  </Button>
                )}
              </div>
            </div>
            {canSend && (
              <p className="mt-2 text-xs text-gray-400">
                Messages can be edited for 5 minutes after sending.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
