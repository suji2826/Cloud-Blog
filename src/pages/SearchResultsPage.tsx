import React, { useState, useEffect } from 'react';
import { Post } from '../types/blog';
import { postsService } from '../services/postsService';
import { BlogCard } from '../components/blog/BlogCard';
import { Search, X, BookOpen } from 'lucide-react';

interface SearchResultsPageProps {
  initialQuery?: string;
  onNavigate: (path: string) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  initialQuery = '',
  onNavigate,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = async (term: string) => {
    setIsLoading(true);
    try {
      const results = await postsService.getPosts({
        search: term.trim() || undefined,
        publishedOnly: true,
        sortBy: 'newest',
      });
      setPosts(results);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    performSearch(query);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Search Bar */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Search Articles
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Find tutorials, architectural patterns, and guides by keyword, topic, or tag.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative mt-4">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your search term (e.g. Cloud, Docker, PostgreSQL)..."
            className="w-full pl-12 pr-12 py-3.5 text-sm rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                performSearch('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pb-2 border-b border-stone-200 dark:border-stone-800">
        <span>
          {query ? (
            <>
              Found <strong>{posts.length}</strong> matching articles for "{query}"
            </>
          ) : (
            <>Showing all <strong>{posts.length}</strong> published articles</>
          )}
        </span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 h-80"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <BookOpen className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800 dark:text-stone-200 mb-1">
            No articles matched your search.
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
            Try searching for common terms like "Cloud", "PostgreSQL", "DevOps", or "React".
          </p>
          <button
            onClick={() => {
              setQuery('');
              performSearch('');
            }}
            className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl"
          >
            Reset Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              onRead={(slug) => onNavigate(`/blog/${slug}`)}
              onTagClick={(tag) => onNavigate(`/blog?tag=${encodeURIComponent(tag)}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
