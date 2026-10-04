import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Cloud, Eye, EyeOff, Lock, Mail, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { UserRole } from '../types/blog';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signIn, switchDemoRole } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email.trim(), password);
      toast('Signed in successfully! Welcome back.', 'success');
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    switchDemoRole(role);
    toast(`Logged in as ${role.toUpperCase()} (Demo Mode)`, 'success');
    if (role === 'admin') onNavigate('/admin');
    else if (role === 'writer') onNavigate('/dashboard');
    else onNavigate('/blog');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-4">
            <Cloud className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
            Enter your credentials to access your writing workspace.
          </p>
        </div>

        {/* Demo Fast Login Cards */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Quick Demo Login (One-Click)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('writer')}
              className="px-2 py-2 rounded-xl text-center bg-white dark:bg-stone-800 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-500 shadow-2xs transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Writer</div>
              <div className="text-[10px] text-stone-500">Sarah Chen</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="px-2 py-2 rounded-xl text-center bg-white dark:bg-stone-800 border border-purple-200 dark:border-purple-700 hover:border-purple-500 shadow-2xs transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-purple-700 dark:text-purple-300">Admin</div>
              <div className="text-[10px] text-stone-500">Alex Rivera</div>
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('reader')}
              className="px-2 py-2 rounded-xl text-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-400 shadow-2xs transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-stone-800 dark:text-stone-200">Reader</div>
              <div className="text-[10px] text-stone-500">Marcus Vance</div>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="writer@cloudblog.io"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast('Password reset link sent to registered email.', 'info')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-stone-600 dark:text-stone-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-sm border-stone-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember this session
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('/signup')}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Sign up for free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
