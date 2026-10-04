import React, { useState, useEffect } from 'react';
import { postsService } from '../services/postsService';
import { Tag, ArrowRight, BookOpen } from 'lucide-react';

interface TagsPageProps {
  onNavigate: (path: string) => void;
}

export const TagsPage: React.FC<TagsPageProps> = ({ onNavigate }) => {
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const posts = await postsService.getPosts({ publishedOnly: true });
        const counts: Record<string, number> = {};
        posts.forEach((p) => {
          p.tags.forEach((t) => {
            counts[t] = (counts[t] || 0) + 1;
          });
        });
        setTagCounts(counts);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
  }, []);

  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Explore Topics & Categories
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Browse articles tagged by specific technologies, languages, and architectural patterns.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="animate-pulse h-24 rounded-2xl bg-stone-100 dark:bg-stone-850"
            />
          ))}
        </div>
      ) : sortedTags.length === 0 ? (
        <div className="p-12 text-center text-sm text-stone-400">
          No tagged articles available yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sortedTags.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => onNavigate(`/blog?tag=${encodeURIComponent(tag)}`)}
              className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md transition-all text-left group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Tag className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-stone-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {count} {count === 1 ? 'post' : 'posts'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  #{tag}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
