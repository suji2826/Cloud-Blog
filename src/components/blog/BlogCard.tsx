import React from 'react';
import { Post } from '../../types/blog';
import { calculateReadingTime, formatDate } from '../../lib/utils';
import { Clock, ArrowRight, User } from 'lucide-react';

interface BlogCardProps {
  post: Post;
  onRead: (slug: string) => void;
  onTagClick?: (tag: string) => void;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, onRead, onTagClick }) => {
  const readingTime = calculateReadingTime(post.markdown);
  const authorName = post.author_profile?.display_name || 'CloudBlog Writer';
  const authorAvatar = post.author_profile?.avatar_url;

  return (
    <article className="group flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Featured Image */}
      <div
        className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100 dark:bg-stone-800 cursor-pointer"
        onClick={() => onRead(post.slug)}
      >
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-sky-500/20 to-teal-500/20">
            <span className="text-4xl opacity-30 select-none">☁️</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-md text-white">
            <Clock className="w-3 h-3" />
            {readingTime}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Title */}
          <h2
            onClick={() => onRead(post.slug)}
            className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2 leading-snug mb-2"
          >
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed mb-4">
            {post.excerpt || post.markdown.substring(0, 140).replace(/[#*`]/g, '') + '...'}
          </p>
        </div>

        {/* Footer: Author & Read More */}
        <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2.5">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-8 h-8 rounded-full object-cover border border-stone-200 dark:border-stone-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="text-xs">
              <span className="font-semibold text-stone-900 dark:text-stone-200 block">
                {authorName}
              </span>
              <time className="text-stone-500 dark:text-stone-400">
                {formatDate(post.published_at || post.created_at)}
              </time>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRead(post.slug)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
          >
            Read More
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
