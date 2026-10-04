import React from 'react';
import { Cloud, Shield, Database, Lock, Server } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenSupabaseModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenSupabaseModal }) => {
  return (
    <footer className="mt-20 border-t border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 backdrop-blur-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-stone-900 dark:text-white tracking-tight">
                CloudBlog
              </span>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md leading-relaxed">
              A modern, production-grade cloud-powered blogging platform built with Supabase Authentication, PostgreSQL Row Level Security (RLS), Supabase Cloud Storage, and full-stack React.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <Shield className="w-3 h-3 text-indigo-500" />
                Postgres RLS Enforced
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <Database className="w-3 h-3 text-sky-500" />
                Supabase Storage Bucket
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <Lock className="w-3 h-3 text-emerald-500" />
                Role-Based Access
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-xs text-stone-400 uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/blog')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Articles & Stories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/search')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Search Posts
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/tags')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Topics & Tags
                </button>
              </li>
            </ul>
          </div>

          {/* Platform & Admin */}
          <div>
            <h4 className="font-semibold text-xs text-stone-400 uppercase tracking-wider mb-3">
              Workspaces
            </h4>
            <ul className="space-y-2 text-sm text-stone-600 dark:text-stone-300">
              <li>
                <button
                  onClick={() => onNavigate('/dashboard')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Writer Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/dashboard/posts/new')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Create Article
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
                >
                  Admin Control Center
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenSupabaseModal}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Server className="w-3.5 h-3.5 text-indigo-500" />
                  Supabase Config
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} CloudBlog. Production-Quality Cloud Architecture Internship Project.</p>
          <div className="flex items-center gap-4">
            <span className="font-medium text-stone-600 dark:text-stone-300">
              Vercel & Supabase Ready
            </span>
            <span>•</span>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              sitemap.xml
            </a>
            <span>•</span>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              robots.txt
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
