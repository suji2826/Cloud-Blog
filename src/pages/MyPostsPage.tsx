import React, { useState, useEffect } from 'react';
import { Post } from '../types/blog';
import { postsService } from '../services/postsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate, calculateReadingTime } from '../lib/utils';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Eye,
  Edit3,
  Globe,
  EyeOff,
  Trash2,
  X,
} from 'lucide-react';

interface MyPostsPageProps {
  onNavigate: (path: string) => void;
}

export const MyPostsPage: React.FC<MyPostsPageProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetPost, setDeleteTargetPost] = useState<Post | null>(null);

  const fetchMyPosts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await postsService.getPosts(
        { authorId: user.id, sortBy: 'newest' },
        { id: user.id, role }
      );
      setPosts(data);
    } catch (e: any) {
      toast('Failed to load your posts.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user, role]);

  const handleTogglePublish = async (post: Post) => {
    if (!user) return;
    try {
      const nextStatus = !post.published;
      await postsService.togglePublish(post.id, nextStatus, { id: user.id, role });
      toast(nextStatus ? 'Post published!' : 'Post moved to drafts.', 'success');
      fetchMyPosts();
    } catch (e: any) {
      toast(e.message || 'Error updating post status.', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetPost || !user) return;
    try {
      await postsService.deletePost(deleteTargetPost.id, { id: user.id, role });
      toast('Post permanently deleted.', 'success');
      setDeleteTargetPost(null);
      fetchMyPosts();
    } catch (e: any) {
      toast(e.message || 'Failed to delete post.', 'error');
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'published' && !p.published) return false;
    if (activeTab === 'drafts' && p.published) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            My Posts
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Manage your articles, drafts, and publication status.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/dashboard/posts/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Article
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-850 p-1 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            All ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'published'
                ? 'bg-white dark:bg-stone-700 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Published ({posts.filter((p) => p.published).length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'drafts'
                ? 'bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Drafts ({posts.filter((p) => !p.published).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter my posts..."
            className="w-full pl-10 pr-9 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Posts List / Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-stone-500">Loading your articles...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 px-4 text-center">
            <FileText className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">
              Start writing your first story.
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-6">
              Create and publish high-quality articles with our live Markdown editor.
            </p>
            <button
              onClick={() => onNavigate('/dashboard/posts/new')}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
            >
              Create Article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50/50 dark:bg-stone-800/40 border-b border-stone-100 dark:border-stone-800">
                <tr>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Read Time</th>
                  <th className="px-6 py-3.5">Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100 max-w-md truncate">
                        {post.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate">
                          /{post.slug}
                        </span>
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500"
                          >
                            #{tag}
                          </span>
                        ))}
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
                      {calculateReadingTime(post.markdown)}
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-500 dark:text-stone-400">
                      {formatDate(post.updated_at)}
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
                          title={post.published ? 'Unpublish' : 'Publish'}
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
