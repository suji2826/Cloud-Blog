import React from 'react';
import { Cloud, Shield, Database, Lock, Code2, Server, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
  onOpenSupabaseModal: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onOpenSupabaseModal }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
          <Cloud className="w-4 h-4" />
          Production-Grade Cloud Architecture
        </div>
        <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight">
          About CloudBlog
        </h1>
        <p className="text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto leading-relaxed">
          CloudBlog is an internship-level cloud-native publishing platform engineered from scratch with Supabase PostgreSQL, Row Level Security, and modern React.
        </p>
      </div>

      {/* Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">
            Row Level Security (RLS)
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Data security is enforced in the PostgreSQL database kernel rather than only application logic. Non-admin writers can only update or delete their own posts, public readers can only view published posts, and admins moderate all posts and comments.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">
            Supabase Cloud Storage
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Featured images are uploaded to the <code className="font-mono text-indigo-500">blog-images</code> storage bucket organized under <code className="font-mono text-indigo-500">userId/postId/filename</code> with strict MIME type checking, size limitations, and upload progress feedback.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">
            Multi-Tier Role-Based Access
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Three dedicated user roles: <strong>Writer</strong> (creates, drafts, publishes own content), <strong>Admin</strong> (governs all articles, moderates comments), and <strong>Reader</strong> (reads published articles and posts comments).
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">
            Live Split Markdown Engine
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            Engineered with GitHub-flavored Markdown support, custom code syntax highlighting with one-click clipboard copying, responsive tables, blockquotes, and dynamic estimated reading time calculation.
          </p>
        </div>
      </div>

      {/* Database Schema & Supabase Setup callout */}
      <div className="p-8 rounded-3xl bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2 justify-center sm:justify-start">
            <Server className="w-5 h-5 text-indigo-500" />
            Supabase SQL Migrations Included
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-lg">
            The database schemas (<code className="font-mono text-indigo-600 dark:text-indigo-400">profiles</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400">posts</code>, <code className="font-mono text-indigo-600 dark:text-indigo-400">comments</code>), triggers, and RLS policies are located in <code className="font-mono text-stone-800 dark:text-stone-200">supabase/schema.sql</code>.
          </p>
        </div>
        <button
          onClick={onOpenSupabaseModal}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          View Supabase Config
        </button>
      </div>

      <div className="text-center pt-6">
        <button
          onClick={() => onNavigate('/blog')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Explore published articles
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
