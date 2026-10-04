import React, { useState, useEffect } from 'react';
import { Post } from '../types/blog';
import { postsService } from '../services/postsService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calculateReadingTime, formatDate } from '../lib/utils';
import { MarkdownRenderer } from '../components/blog/MarkdownRenderer';
import { CommentsSection } from '../components/comments/CommentsSection';
import {
  ArrowLeft,
  Clock,
  Calendar,
  Share2,
  Edit,
  EyeOff,
  User,
} from 'lucide-react';

interface BlogPostPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onNavigate }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const found = await postsService.getPostBySlug(
          slug,
          user ? { id: user.id, role } : null
        );
        setPost(found);

        // Dynamic SEO Metadata updates
        if (found) {
          document.title = `${found.title} – CloudBlog`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute(
              'content',
              found.excerpt || found.markdown.slice(0, 150)
            );
          }
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.setAttribute('content', `${found.title} – CloudBlog`);
          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) {
            ogDesc.setAttribute(
              'content',
              found.excerpt || found.markdown.slice(0, 150)
            );
          }
        }
      } catch (e) {
        console.error('Error fetching post by slug:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();

    return () => {
      document.title = 'CloudBlog – Cloud-Based Blogging Platform';
    };
  }, [slug, user, role]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast('Article link copied to clipboard!', 'success');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 animate-pulse space-y-6">
        <div className="h-6 w-24 bg-stone-200 dark:bg-stone-800 rounded-sm" />
        <div className="h-10 w-3/4 bg-stone-200 dark:bg-stone-800 rounded-lg" />
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        <div className="space-y-3">
          <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-sm w-full" />
          <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-sm w-5/6" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Post Not Found
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
          The requested article may have been unpublished or removed.
        </p>
        <button
          onClick={() => onNavigate('/blog')}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
        >
          Return to Blog
        </button>
      </div>
    );
  }

  const readingTime = calculateReadingTime(post.markdown);
  const isAuthor = user?.id === post.author;
  const isAdmin = role === 'admin';
  const canEdit = isAuthor || isAdmin;
  const authorName = post.author_profile?.display_name || 'CloudBlog Writer';
  const authorAvatar = post.author_profile?.avatar_url;
  const authorBio = post.author_profile?.bio || 'Author and engineering contributor at CloudBlog.';

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Nav & Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/blog')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all articles
        </button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => onNavigate(`/dashboard/posts/${post.id}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-indigo-500" />
              Edit Post
            </button>
          )}

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer"
            title="Share article link"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Unpublished Draft Notice */}
      {!post.published && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3 text-amber-800 dark:text-amber-200 text-sm">
          <EyeOff className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold">Unpublished Draft.</span> This post is currently only visible to you ({isAuthor ? 'author' : 'admin'}).
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onNavigate(`/blog?tag=${encodeURIComponent(tag)}`)}
            className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
        {post.title}
      </h1>

      {/* Excerpt if present */}
      {post.excerpt && (
        <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
          {post.excerpt}
        </p>
      )}

      {/* Author and Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-11 h-11 rounded-full object-cover border border-stone-200 dark:border-stone-700"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              {authorName}
              {post.author_profile?.role === 'admin' && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {post.author_profile?.bio || 'CloudBlog contributor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span>{formatDate(post.published_at || post.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-stone-400" />
            <span>{readingTime}</span>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-md">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full max-h-[460px] object-cover"
          />
        </div>
      )}

      {/* Markdown Content */}
      <div className="pt-4">
        <MarkdownRenderer content={post.markdown} />
      </div>

      {/* Author Bio Box */}
      <div className="mt-12 p-6 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-start gap-4">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-14 h-14 rounded-full object-cover shrink-0 border border-stone-200 dark:border-stone-700"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 shrink-0 font-bold text-lg">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Written by
          </div>
          <div className="font-bold text-base text-stone-900 dark:text-stone-100">
            {authorName}
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            {authorBio}
          </p>
        </div>
      </div>

      {/* Comments Section */}
      <CommentsSection
        postId={post.id}
        onNavigateToLogin={() => onNavigate('/login')}
      />
    </article>
  );
};
