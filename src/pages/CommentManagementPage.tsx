import React, { useState, useEffect } from 'react';
import { Comment, Post } from '../types/blog';
import { commentsService } from '../services/commentsService';
import { postsService } from '../services/postsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatRelativeTime } from '../lib/utils';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  MessageSquare,
  Shield,
  Trash2,
  ExternalLink,
  Search,
  ArrowLeft,
  User,
} from 'lucide-react';

interface CommentManagementPageProps {
  onNavigate: (path: string) => void;
}

export const CommentManagementPage: React.FC<CommentManagementPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [postsMap, setPostsMap] = useState<Record<string, Post>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadCommentsData = async () => {
    try {
      setIsLoading(true);
      const allComments = await commentsService.getAllComments();
      setComments(allComments);

      const allPosts = await postsService.getPosts({}, { id: user?.id || '', role: 'admin' });
      const map: Record<string, Post> = {};
      allPosts.forEach((p) => {
        map[p.id] = p;
      });
      setPostsMap(map);
    } catch (e: any) {
      toast('Failed to load comments.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommentsData();
  }, [user, role]);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId || !user) return;
    try {
      await commentsService.deleteComment(deleteTargetId, {
        id: user.id,
        role: 'admin',
      });
      setComments((prev) => prev.filter((c) => c.id !== deleteTargetId));
      toast('Comment removed by moderator.', 'success');
      setDeleteTargetId(null);
    } catch (e: any) {
      toast(e.message || 'Failed to remove comment.', 'error');
    }
  };

  if (role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Restricted Access</h2>
        <p className="text-sm text-stone-500 mb-4">
          Only administrators can access the comment moderation dashboard.
        </p>
        <button
          onClick={() => onNavigate('/')}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
        >
          Return Home
        </button>
      </div>
    );
  }

  const filteredComments = comments.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const userName = c.user_profile?.display_name.toLowerCase() || '';
    const postTitle = postsMap[c.post_id]?.title.toLowerCase() || '';
    return c.body.toLowerCase().includes(q) || userName.includes(q) || postTitle.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin')}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              Comment Moderation
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Audit and remove inappropriate comments across all community posts.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search comments, users, or posts..."
            className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-stone-500">Loading comments...</div>
        ) : filteredComments.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-400">
            No comments match your search or no comments exist yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {filteredComments.map((comment) => {
              const author = comment.user_profile;
              const post = postsMap[comment.post_id];

              return (
                <div
                  key={comment.id}
                  className="p-5 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {author?.avatar_url ? (
                        <img
                          src={author.avatar_url}
                          alt={author.display_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          {author?.display_name || 'User'}
                          <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-stone-100 dark:bg-stone-800 text-stone-500 uppercase">
                            {author?.role || 'reader'}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-stone-800 dark:text-stone-200 whitespace-pre-line pl-11">
                      {comment.body}
                    </p>

                    {post && (
                      <div className="pl-11 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                        <span>On article:</span>
                        <button
                          onClick={() => onNavigate(`/blog/${post.slug}`)}
                          className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {post.title}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setDeleteTargetId(comment.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Moderator: Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDeleteConfirm}
        title="Moderate Comment"
        message="Are you sure you want to permanently delete this comment as an Administrator?"
        confirmText="Remove Comment"
      />
    </div>
  );
};
