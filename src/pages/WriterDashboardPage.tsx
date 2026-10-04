import React, { useState, useEffect } from 'react';
import { Post, DashboardMetrics } from '../types/blog';
import { postsService } from '../services/postsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/utils';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  FileText,
  CheckCircle,
  Clock,
  MessageSquare,
  Plus,
  Edit3,
  Eye,
  Trash2,
  Globe,
  EyeOff,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface WriterDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const WriterDashboardPage: React.FC<WriterDashboardPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalComments: 0,
  });
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetPost, setDeleteTargetPost] = useState<Post | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const metricsData = await postsService.getDashboardMetrics(user.id, role === 'admin');
      setMetrics(metricsData);

      const postsData = await postsService.getPosts(
        { authorId: user.id, sortBy: 'newest' },
        { id: user.id, role }
      );
      setRecentPosts(postsData.slice(0, 5));
    } catch (e: any) {
      toast('Failed to load dashboard data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, role]);

  const handleTogglePublish = async (post: Post) => {
    if (!user) return;
    try {
      const nextStatus = !post.published;
      await postsService.togglePublish(post.id, nextStatus, { id: user.id, role });
      toast(nextStatus ? 'Post published successfully!' : 'Post moved to drafts.', 'success');
      loadData();
    } catch (e: any) {
      toast(e.message || 'Failed to update publish state.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetPost || !user) return;
    try {
      await postsService.deletePost(deleteTargetPost.id, { id: user.id, role });
      toast('Post permanently deleted.', 'success');
      setDeleteTargetPost(null);
      loadData();
    } catch (e: any) {
      toast(e.message || 'Could not delete post.', 'error');
    }
  };

  if (role === 'reader') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-4">
          <EyeOff className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
            Writer Access Required
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Your current account role is <strong>Reader</strong>. Readers can explore published articles and participate in discussions. Switch to <strong>Writer</strong> or <strong>Admin</strong> in the top bar to test creating content.
          </p>
          <button
            onClick={() => onNavigate('/blog')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            Explore Published Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            Writer Dashboard
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Welcome, {user?.profile.display_name}. Manage your articles, drafts, and readership.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/dashboard/posts/new')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Article
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Total Articles
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            {metrics.totalPosts}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Authored in database
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Published
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            {metrics.publishedPosts}
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            Live and readable publicly
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Drafts
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            {metrics.draftPosts}
          </div>
          <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            Work in progress
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Comments
            </span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white">
            {metrics.totalComments}
          </div>
          <div className="text-[11px] text-sky-600/80 dark:text-sky-400/80 mt-1">
            Community feedback
          </div>
        </div>
      </div>

      {/* Recent Posts Table Section */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">
              Recent Articles
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Manage your latest written stories and draft revisions
            </p>
          </div>
          <button
            onClick={() => onNavigate('/dashboard/posts')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View all posts
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-stone-500">Loading your articles...</div>
        ) : recentPosts.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <FileText className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">
              Start writing your first story.
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
              Your drafts and published articles will appear here.
            </p>
            <button
              onClick={() => onNavigate('/dashboard/posts/new')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              Write First Story
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50/50 dark:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800">
                <tr>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5">Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {recentPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 max-w-md truncate">
                        {post.title}
                      </div>
                      <div className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">
                        /{post.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500 dark:text-stone-400">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500 dark:text-stone-400">
                      {formatDate(post.updated_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`/blog/${post.slug}`)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="View live post"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate(`/dashboard/posts/${post.id}/edit`)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Edit post"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            post.published
                              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={post.published ? 'Unpublish post' : 'Publish post'}
                        >
                          {post.published ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteTargetPost(post)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetPost)}
        onClose={() => setDeleteTargetPost(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to permanently delete this post?"
        confirmText="Delete Post"
      />
    </div>
  );
};
