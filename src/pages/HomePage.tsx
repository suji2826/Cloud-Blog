import React, { useState, useEffect } from 'react';
import { Post } from '../types/blog';
import { postsService } from '../services/postsService';
import { BlogCard } from '../components/blog/BlogCard';
import { useAuth } from '../context/AuthContext';
import {
  PenSquare,
  Sparkles,
  ArrowRight,
  Database,
  Shield,
  Layers,
  Zap,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [featuredPosts, setFeaturedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      try {
        const posts = await postsService.getPosts({ publishedOnly: true, sortBy: 'newest' });
        setFeaturedPosts(posts.slice(0, 3));
      } catch (e) {
        console.error('Failed to load featured posts:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const popularTags = [
    'Cloud',
    'DevOps',
    'PostgreSQL',
    'Architecture',
    'Security',
    'Programming',
    'Web Development',
    'AI',
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 dark:opacity-20 pointer-events-none">
          <div className="w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500 to-sky-400 rounded-full blur-3xl filter" />
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Cloud-Native Blogging Infrastructure</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-stone-900 dark:text-white tracking-tight leading-tight sm:leading-none mb-6">
            Write. Publish.{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-teal-500 bg-clip-text text-transparent">
              Inspire.
            </span>
          </h1>

          {/* Hero Subtitle */}
          <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
            A modern cloud-powered blogging platform for creators, writers, and readers.
            Engineered with Supabase Authentication, PostgreSQL Row Level Security, and high-performance Markdown.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onNavigate(user ? '/dashboard/posts/new' : '/signup')}
              className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <PenSquare className="w-5 h-5" />
              Start Writing
            </button>
            <button
              onClick={() => onNavigate('/blog')}
              className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <BookOpen className="w-5 h-5 text-stone-400" />
              Explore Blogs
            </button>
          </div>
        </div>
      </section>

      {/* Cloud Platform Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Supabase PostgreSQL
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Fully indexed relational data tables with foreign keys and automatic triggers on user sign up.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Row Level Security
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Database-level kernel policies ensuring writers can only alter their own posts and admins moderate all content.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Cloud Storage Bucket
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Dedicated <code className="font-mono text-indigo-600 dark:text-indigo-400">blog-images</code> bucket with MIME validation, progress tracking, and size limits.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-stone-900 dark:text-white text-base mb-1">
              Live Markdown Engine
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Split-pane editor with live preview, code highlighting, copy button, and estimated reading time.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              Featured Stories
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
              Latest from the Community
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/blog')}
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer"
          >
            View all articles
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                onRead={(slug) => onNavigate(`/blog/${slug}`)}
                onTagClick={(tag) => onNavigate(`/blog?tag=${encodeURIComponent(tag)}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Popular Topics / Tags */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-stone-100/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 text-center">
          <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Explore Topics & Technologies
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto mb-6">
            Discover curated content across cloud infrastructure, distributed systems, web development, and DevOps.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onNavigate(`/blog?tag=${encodeURIComponent(tag)}`)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
