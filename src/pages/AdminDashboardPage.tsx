import React, { useState, useEffect } from 'react';
import { Post, DashboardMetrics, Profile } from '../types/blog';
import { postsService } from '../services/postsService';
import { profilesService } from '../services/profilesService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/utils';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  Shield,
  Users,
  FileText,
  Globe,
  Clock,
  MessageSquare,
  Edit3,
  Eye,
  Trash2,
  CheckCircle,
  EyeOff,
  Search,
  ExternalLink,
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalComments: 0,
    totalUsers: 0,
  });
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetPost, setDeleteTargetPost] = useState<Post | null>(null);

  const loadAdminData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const metricsData = await postsService.getDashboardMetrics(undefined, true);
      setMetrics(metricsData);

      const postsData = await postsService.getPosts(
        { sortBy: 'newest' },
        { id: user.id, role: 'admin' }
      );
      setAllPosts(postsData);

      const profilesData = await profilesService.getAllProfiles();
      setProfiles(profilesData);
    } catch (e: any) {
      toast('Failed to load admin data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [user, role]);

  const handleTogglePublish = async (post: Post) => {
    if (!user) return;
    try {
      const nextStatus = !post.published;
      await postsService.togglePublish(post.id, nextStatus, { id: user.id, role: 'admin' });
      toast(nextStatus ? 'Post published by Admin!' : 'Post unpublished by Admin.', 'success');
      loadAdminData();
    } catch (e: any) {
      toast(e.message || 'Error updating status.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetPost || !user) return;
    try {
      await postsService.deletePost(deleteTargetPost.id, { id: user.id, role: 'admin' });
      toast('Post permanently removed by administrator.', 'success');
      setDeleteTargetPost(null);
      loadAdminData();
    } catch (e: any) {
      toast(e.message || 'Failed to delete post.', 'error');
    }
  };

  if (role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="p-8 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-4">
          <Shield className="w-12 h-12 text-rose-600 mx-auto" />
          <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100">
            Administrator Access Only
          </h2>
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Row Level Security prevents non-admin roles from accessing the administration control center. Use the demo role switcher in the top bar to switch to <strong>Admin</strong>.
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const filteredPosts = allPosts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const authorName = p.author_profile?.display_name.toLowerCase() || '';
    return (
      p.title.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      authorName.includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Administrator Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            Platform Overview & Content Moderation
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Global management of articles, authors, permissions, and comments.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/admin/comments')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 shadow-2xs transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-purple-500" />
          Moderate Comments
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Total Users
            </span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {metrics.totalUsers || profiles.length}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Registered profiles</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Total Posts
            </span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {metrics.totalPosts}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Platform-wide</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Published
            </span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {metrics.publishedPosts}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Publicly visible</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Drafts
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {metrics.draftPosts}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Unpublished</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Comments
            </span>
            <MessageSquare className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 dark:text-white">
            {metrics.totalComments}
          </div>
          <div className="text-[10px] text-stone-400 mt-1">Reader comments</div>
        </div>
      </div>

      {/* Post Management Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">
              Platform Post Management
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Admin rights to inspect, update, or remove any story across all writers
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts or authors..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-stone-500">Loading platform data...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-sm text-stone-500">No posts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50/50 dark:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800">
                <tr>
                  <th className="px-6 py-3.5">Title & Slug</th>
                  <th className="px-6 py-3.5">Author</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 max-w-sm truncate">
                        {post.title}
                      </div>
                      <div className="text-xs font-mono text-stone-400 truncate">
                        /{post.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-xs text-stone-900 dark:text-stone-200">
                        {post.author_profile?.display_name || 'Author'}
                      </div>
                      <span className="text-[10px] text-stone-400 capitalize">
                        {post.author_profile?.role || 'writer'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {post.published ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500 dark:text-stone-400">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`/blog/${post.slug}`)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="View post"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigate(`/dashboard/posts/${post.id}/edit`)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Edit post (Admin)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(post)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            post.published
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={post.published ? 'Admin: Unpublish' : 'Admin: Publish'}
                        >
                          {post.published ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteTargetPost(post)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Admin: Delete post"
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
        title="Admin: Permanently Delete Post"
        message="Are you sure you want to permanently delete this post as an Administrator? Associated comments will be cascade deleted."
        confirmText="Permanently Delete"
      />
    </div>
  );
};
