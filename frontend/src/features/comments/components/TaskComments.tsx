'use client';

import { useCallback, useEffect, useState } from 'react';
import { commentService } from '../services/comment.service';
import type { TaskComment } from '../types';
import { Button } from '@/shared/components/ui/Button';
import { TextArea } from '@/shared/components/ui/TextArea';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatDate } from '@/features/dashboard/utils/stats';

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await commentService.list(taskId);
      setComments(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleCreate = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await commentService.create(taskId, { content: content.trim() });
      setContent('');
      await loadComments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    setError('');
    try {
      await commentService.update(taskId, commentId, {
        content: editContent.trim(),
      });
      setEditingId(null);
      setEditContent('');
      await loadComments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    setError('');
    try {
      await commentService.remove(taskId, commentId);
      await loadComments();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Comments</h3>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isAuthor = comment.author.id === user?.id;
            const isEditing = editingId === comment.id;

            return (
              <div
                key={comment.id}
                className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {comment.author.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  {isAuthor && !isEditing && (
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        className="text-primary-600 hover:text-primary-700"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => void handleDelete(comment.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <TextArea
                      rows={2}
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => void handleUpdate(comment.id)}
                        isLoading={isSubmitting}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        className="px-3 py-1.5 text-xs"
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                    {comment.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <TextArea
          rows={2}
          placeholder="Write a comment..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <Button
          type="button"
          className="px-3 py-1.5 text-xs"
          onClick={() => void handleCreate()}
          isLoading={isSubmitting}
          disabled={!content.trim()}
        >
          Add comment
        </Button>
      </div>
    </div>
  );
}
