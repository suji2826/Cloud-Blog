/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { SupabaseConfigModal } from './components/ui/SupabaseConfigModal';

// Pages
import { HomePage } from './pages/HomePage';
import { BlogListPage } from './pages/BlogListPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { WriterDashboardPage } from './pages/WriterDashboardPage';
import { MyPostsPage } from './pages/MyPostsPage';
import { PostEditorPage } from './pages/PostEditorPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CommentManagementPage } from './pages/CommentManagementPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { TagsPage } from './pages/TagsPage';
import { AboutPage } from './pages/AboutPage';
import { NotFoundPage } from './pages/NotFoundPage';

function Router() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.search || '/';
    }
    return '/';
  });

  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Sync with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Parse path and query parameters
  const [pathname, searchStr] = currentPath.split('?');
  const searchParams = new URLSearchParams(searchStr || '');

  // Route matching logic
  const renderCurrentPage = () => {
    // 1. Home
    if (pathname === '/' || pathname === '') {
      return <HomePage onNavigate={navigate} />;
    }

    // 2. Blog List: /blog
    if (pathname === '/blog') {
      const tagParam = searchParams.get('tag') || undefined;
      return <BlogListPage initialTag={tagParam} onNavigate={navigate} />;
    }

    // 3. Blog Post: /blog/:slug
    if (pathname.startsWith('/blog/')) {
      const slug = pathname.replace('/blog/', '').trim();
      if (slug) {
        return <BlogPostPage slug={slug} onNavigate={navigate} />;
      }
    }

    // 4. Login: /login
    if (pathname === '/login') {
      return <LoginPage onNavigate={navigate} />;
    }

    // 5. Sign Up: /signup
    if (pathname === '/signup') {
      return <SignUpPage onNavigate={navigate} />;
    }

    // --- PROTECTED ROUTES (Write, Dashboard, My Posts, Profile, Admin) ---
    // Show spinner if Supabase session is still resolving
    if (isLoading) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-stone-500">Checking authentication session...</p>
        </div>
      );
    }

    // If not authenticated, redirect/show Login page
    if (!user) {
      if (
        pathname === '/dashboard' ||
        pathname === '/dashboard/posts' ||
        pathname === '/dashboard/posts/new' ||
        (pathname.startsWith('/dashboard/posts/') && pathname.endsWith('/edit')) ||
        pathname === '/profile' ||
        pathname === '/admin' ||
        pathname === '/admin/comments'
      ) {
        return <LoginPage onNavigate={navigate} />;
      }
    }

    // 6. Writer Dashboard: /dashboard
    if (pathname === '/dashboard') {
      return <WriterDashboardPage onNavigate={navigate} />;
    }

    // 7. My Posts: /dashboard/posts
    if (pathname === '/dashboard/posts') {
      return <MyPostsPage onNavigate={navigate} />;
    }

    // 8. Create Post: /dashboard/posts/new
    if (pathname === '/dashboard/posts/new') {
      return <PostEditorPage onNavigate={navigate} />;
    }

    // 9. Edit Post: /dashboard/posts/:id/edit
    if (pathname.startsWith('/dashboard/posts/') && pathname.endsWith('/edit')) {
      const parts = pathname.split('/');
      const postId = parts[3];
      if (postId) {
        return <PostEditorPage postId={postId} onNavigate={navigate} />;
      }
    }

    // 10. Profile: /profile
    if (pathname === '/profile') {
      return <ProfilePage onNavigate={navigate} />;
    }

    // 11. Admin Dashboard: /admin
    if (pathname === '/admin') {
      return <AdminDashboardPage onNavigate={navigate} />;
    }

    // 12. Comment Management: /admin/comments
    if (pathname === '/admin/comments') {
      return <CommentManagementPage onNavigate={navigate} />;
    }

    // 13. Search: /search
    if (pathname === '/search') {
      const q = searchParams.get('q') || '';
      return <SearchResultsPage initialQuery={q} onNavigate={navigate} />;
    }

    // 14. Tags: /tags
    if (pathname === '/tags') {
      return <TagsPage onNavigate={navigate} />;
    }

    // 15. About: /about
    if (pathname === '/about') {
      return <AboutPage onNavigate={navigate} onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />;
    }

    // 16. Fallback: 404
    return <NotFoundPage onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentPath={pathname}
        onNavigate={navigate}
      />

      {/* Main Page Body */}
      <main className="flex-1">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={navigate}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
      />

      {/* Supabase Database Settings Modal */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
