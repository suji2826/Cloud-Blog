import React from 'react';
import { CloudOff, Home, BookOpen } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-md">
          <CloudOff className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Error 404
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            The page or article you are looking for doesn't exist, has been unpublished, or has moved to a new cloud route.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('/')}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => onNavigate('/blog')}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-stone-400" />
            Browse Blogs
          </button>
        </div>
      </div>
    </div>
  );
};
