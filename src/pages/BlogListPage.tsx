import React, { useState, useEffect } from 'react';
import { Post } from '../types/blog';
import { postsService } from '../services/postsService';
import { BlogCard } from '../components/blog/BlogCard';
import { Search, Filter, SlidersHorizontal, BookOpen, X } from 'lucide-react';

interface BlogListPageProps {
  initialTag?: string;
  onNavigate: (path: string) => void;
}

export const BlogListPage: React.FC<BlogListPageProps> = ({ initialTag, onNavigate }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest');

  const availableTags = [
    'All',
    'Cloud',
    'DevOps',
    'PostgreSQL',
    'Architecture',
    'Security',
    'Programming',
    'Web Development',
    'Tutorials',
    'AI',
  ];

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await postsService.getPosts({
        tag: selectedTag && selectedTag !== 'All' ? selectedTag : undefined,
        search: searchQuery.trim() || undefined,
        sortBy,
        publishedOnly: true, // Only published posts appear publicly
      });
      setPosts(data);
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTag) {
      setSelectedTag(initialTag);
    }
  }, [initialTag]);

  useEffect(() => {
    fetchPosts();
  }, [selectedTag, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Explore Articles & Guides
        </h1>
        <p className="text-base text-stone-600 dark:text-stone-400 mt-2">
          Discover insights, best practices, and deep-dives into modern cloud technologies.
        </p>
      </div>

      {/* Controls: Search, Tag Filters, Sort */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, excerpt, tags, or content..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  postsService
                    .getPosts({
                      tag: selectedTag && selectedTag !== 'All' ? selectedTag : undefined,
                      sortBy,
                      publishedOnly: true,
                    })
                    .then(setPosts);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort articles"
                className="appearance-none pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title-asc">A – Z</option>
                <option value="title-desc">Z – A</option>
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-stone-400 shrink-0 ml-1 hidden sm:block" />
          {availableTags.map((tag) => {
            const isSelected =
              (tag === 'All' && !selectedTag) ||
              selectedTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === 'All' ? '' : tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 h-96 p-4 flex flex-col justify-between"
            >
              <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-xl mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded-sm w-3/4" />
                <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded-sm w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mb-1">
            {searchQuery ? 'No articles matched your search.' : 'No posts published yet.'}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-6">
            Try adjusting your search terms or selecting another tag filter.
          </p>
          {(searchQuery || selectedTag) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTag('');
              }}
              className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onRead={(slug) => onNavigate(`/blog/${slug}`)}
              onTagClick={(tag) => setSelectedTag(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
