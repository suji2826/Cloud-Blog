import React, { useState, useEffect } from 'react';
import { Comment } from '../../types/blog';
import { commentsService } from '../../services/commentsService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatRelativeTime } from '../../lib/utils';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { MessageSquare, Send, Trash2, Edit3, User, Check, X, ShieldAlert } from 'lucide-react';

interface CommentsSectionProps {
  postId: string;
  onNavigateToLogin: () => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId, onNavigateToLogin }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Delete dialog state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await commentsService.getCommentsByPostId(postId);
      setComments(data);
    } catch (e: any) {
      toast('Failed to load comments.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onNavigateToLogin();
      return;
    }
    if (!newCommentBody.trim()) {
      toast('Please write a comment first.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await commentsService.createComment(postId, user.id, newCommentBody);
      setComments((prev) => [...prev, created]);
      setNewCommentBody('');
      toast('Comment posted successfully!', 'success');
    } catch (e: any) {
      toast(e.message || 'Could not post comment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!user) return;
    if (!editingText.trim()) {
      toast('Comment text cannot be empty.', 'error');
      return;
    }

    try {
      const updated = await commentsService.updateComment(commentId, editingText, {
        id: user.id,
        role,
      });
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingCommentId(null);
      setEditingText('');
      toast('Comment updated.', 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to update comment.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId || !user) return;
    try {
      await commentsService.deleteComment(deleteTargetId, {
        id: user.id,
        role,
      });
      setComments((prev) => prev.filter((c) => c.id !== deleteTargetId));
      toast('Comment removed.', 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to delete comment.', 'error');
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <section className="mt-12 pt-10 border-t border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Comments ({comments.length})
        </h3>
      </div>

      {/* New Comment Form */}
      {user ? (
        <form onSubmit={handleAddComment} className="mb-10">
          <div className="flex gap-3.5">
            <div className="shrink-0">
              {user.profile.avatar_url ? (
                <img
                  src={user.profile.avatar_url}
                  alt={user.profile.display_name}
                  className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold">
                  {user.profile.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={newCommentBody}
                onChange={(e) => setNewCommentBody(e.target.value)}
                placeholder="Share your thoughts on this article..."
                rows={3}
                className="w-full p-3.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newCommentBody.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-6 rounded-2xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 text-center">
          <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
            Join the conversation and discuss this article with the author and community.
          </p>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Log in to Comment
          </button>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse flex gap-3 p-4 rounded-xl bg-stone-50 dark:bg-stone-900">
              <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-md w-1/4" />
                <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-md w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
          <MessageSquare className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <p className="text-stone-600 dark:text-stone-400 font-medium text-sm">
            Be the first to join the conversation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isOwnComment = user?.id === comment.user_id;
            const canModerate = role === 'admin';
            const isEditing = editingCommentId === comment.id;
            const author = comment.user_profile;

            return (
              <div
                key={comment.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    {author?.avatar_url ? (
                      <img
                        src={author.avatar_url}
                        alt={author.display_name}
                        className="w-9 h-9 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                          {author?.display_name || 'Community Member'}
                        </span>
                        {author?.role === 'admin' && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                        {author?.role === 'writer' && (
                          <span className="px-1.5 py-0.2 text-[10px] font-medium rounded-sm bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Author
                          </span>
                        )}
                      </div>
                      <time className="text-xs text-stone-500 dark:text-stone-400">
                        {formatRelativeTime(comment.created_at)}
                        {comment.updated_at && comment.updated_at !== comment.created_at && ' (edited)'}
                      </time>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {isOwnComment && !isEditing && (
                      <button
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditingText(comment.body);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                        title="Edit comment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {(isOwnComment || canModerate) && !isEditing && (
                      <button
                        onClick={() => setDeleteTargetId(comment.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          canModerate && !isOwnComment
                            ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                            : 'text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                        title={canModerate && !isOwnComment ? 'Moderate comment (Admin)' : 'Delete comment'}
                      >
                        {canModerate && !isOwnComment ? (
                          <ShieldAlert className="w-4 h-4" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Body or Inline Editor */}
                {isEditing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={2}
                      className="w-full p-3 text-sm rounded-xl border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCommentId(null)}
                        className="px-3 py-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line pl-12">
                    {comment.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Comment"
        message="Are you sure you want to permanently remove this comment?"
        confirmText="Delete Comment"
      />
    </section>
  );
};
