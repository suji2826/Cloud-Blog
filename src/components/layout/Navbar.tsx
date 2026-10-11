import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Cloud,
  Search,
  PenSquare,
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  Shield,
  FileText,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  Check,
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, role, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const handleNav = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
    { label: 'Tags', path: '/tags' },
    { label: 'About', path: '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleNav('/')}
              className="flex items-center gap-2.5 text-stone-900 dark:text-stone-100 font-extrabold text-xl tracking-tight hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Cloud className="w-5 h-5 fill-white/20" />
              </div>
              <span className="bg-gradient-to-r from-stone-900 via-stone-800 to-indigo-900 dark:from-white dark:via-stone-100 dark:to-indigo-300 bg-clip-text text-transparent">
                CloudBlog
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = currentPath === link.path;
                return (
                  <button
                    key={link.path}
                    onClick={() => handleNav(link.path)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/70 dark:hover:bg-stone-800/70'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => handleNav('/search')}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Search articles"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Theme Toggle Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setThemeDropdownOpen(!themeDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'light' ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                ) : theme === 'dark' ? (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                ) : (
                  <Laptop className="w-4 h-4 sm:w-5 sm:h-5 text-stone-500" />
                )}
              </button>

              {themeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => {
                      setTheme('light');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer ${
                      theme === 'light'
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-stone-700 dark:text-stone-300'
                    } hover:bg-stone-100 dark:hover:bg-stone-800`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                    </span>
                    {theme === 'light' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setTheme('dark');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer ${
                      theme === 'dark'
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-stone-700 dark:text-stone-300'
                    } hover:bg-stone-100 dark:hover:bg-stone-800`}
                  >
                    <span className="flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
                    </span>
                    {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setTheme('system');
                      setThemeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer ${
                      theme === 'system'
                        ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-stone-700 dark:text-stone-300'
                    } hover:bg-stone-100 dark:hover:bg-stone-800`}
                  >
                    <span className="flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-stone-400" /> System
                    </span>
                    {theme === 'system' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Authenticated State vs Logged Out State */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Write Button (for writer and admin) */}
                {(role === 'writer' || role === 'admin') && (
                  <button
                    onClick={() => handleNav('/dashboard/posts/new')}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    <span>Write</span>
                  </button>
                )}

                {/* Profile Avatar Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(!profileDropdownOpen);
                      setThemeDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-indigo-500/50 transition-all cursor-pointer"
                  >
                    {user.profile.avatar_url ? (
                      <img
                        src={user.profile.avatar_url}
                        alt={user.profile.display_name}
                        className="w-8 h-8 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                        {user.profile.display_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-stone-100 dark:border-stone-800">
                        <div className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                          {user.profile.display_name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {user.email}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-sm bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                          Role: {role}
                        </span>
                      </div>

                      <div className="py-1">
                        {(role === 'writer' || role === 'admin') && (
                          <>
                            <button
                              onClick={() => handleNav('/dashboard')}
                              className="w-full text-left px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 cursor-pointer"
                            >
                              <LayoutDashboard className="w-4 h-4 text-stone-400" />
                              Writer Dashboard
                            </button>
                            <button
                              onClick={() => handleNav('/dashboard/posts')}
                              className="w-full text-left px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-stone-400" />
                              My Posts
                            </button>
                          </>
                        )}

                        {role === 'admin' && (
                          <>
                            <div className="border-t border-stone-100 dark:border-stone-800 my-1" />
                            <div className="px-4 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                              Admin Controls
                            </div>
                            <button
                              onClick={() => handleNav('/admin')}
                              className="w-full text-left px-4 py-2 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2.5 cursor-pointer font-medium"
                            >
                              <Shield className="w-4 h-4 text-purple-500" />
                              Admin Dashboard
                            </button>
                            <button
                              onClick={() => handleNav('/admin/comments')}
                              className="w-full text-left px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 text-stone-400" />
                              Comment Moderation
                            </button>
                          </>
                        )}

                        <div className="border-t border-stone-100 dark:border-stone-800 my-1" />
                        <button
                          onClick={() => handleNav('/profile')}
                          className="w-full text-left px-4 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-2.5 cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-stone-400" />
                          Profile Settings
                        </button>
                        <button
                          onClick={() => {
                            signOut();
                            setProfileDropdownOpen(false);
                            handleNav('/');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Unauthenticated / Logged Out: Show "Sign in" and "Get Started" buttons only */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  onClick={() => handleNav('/signup')}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-3">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => handleNav(link.path)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${
                currentPath === link.path
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            {user ? (
              <div className="space-y-1">
                {(role === 'writer' || role === 'admin') && (
                  <button
                    onClick={() => handleNav('/dashboard/posts/new')}
                    className="w-full my-2 px-4 py-2.5 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                  >
                    Create New Article
                  </button>
                )}
                <button
                  onClick={() => handleNav('/dashboard')}
                  className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300"
                >
                  Writer Dashboard
                </button>
                <button
                  onClick={() => handleNav('/dashboard/posts')}
                  className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300"
                >
                  My Posts
                </button>
                <button
                  onClick={() => handleNav('/profile')}
                  className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300"
                >
                  Profile Settings
                </button>
                {role === 'admin' && (
                  <button
                    onClick={() => handleNav('/admin')}
                    className="w-full text-left px-3 py-2 text-sm text-purple-600 dark:text-purple-400 font-medium"
                  >
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                    handleNav('/');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 font-medium"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => handleNav('/login')}
                  className="w-full py-2.5 text-center text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 rounded-xl"
                >
                  Sign in
                </button>
                <button
                  onClick={() => handleNav('/signup')}
                  className="w-full py-2.5 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
