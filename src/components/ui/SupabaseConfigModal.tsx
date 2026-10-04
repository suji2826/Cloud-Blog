import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Database, CheckCircle, ExternalLink, Key, RefreshCw } from 'lucide-react';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { isSupabaseConfigured, setCustomSupabaseConfig, resetDemoData } = useAuth();
  const { toast } = useToast();

  const [url, setUrl] = useState(
    localStorage.getItem('CLOUDBLOG_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || ''
  );
  const [key, setKey] = useState(
    localStorage.getItem('CLOUDBLOG_SUPABASE_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      toast('Please provide both Project URL and Anon Key.', 'error');
      return;
    }
    if (!url.startsWith('https://')) {
      toast('Project URL must start with https://', 'error');
      return;
    }
    setCustomSupabaseConfig(url.trim(), key.trim());
    toast('Supabase credentials saved! Reloading application...', 'success');
  };

  const handleClear = () => {
    localStorage.removeItem('CLOUDBLOG_SUPABASE_URL');
    localStorage.removeItem('CLOUDBLOG_SUPABASE_KEY');
    window.location.reload();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supabase Database & Cloud Storage" maxWidth="lg">
      <div className="space-y-6">
        {/* Status card */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isSupabaseConfigured
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
              : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-200'
          }`}
        >
          <div className="p-2 rounded-lg bg-white/80 dark:bg-stone-900/80 shrink-0">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-sm">
            <div className="font-semibold text-base mb-1">
              {isSupabaseConfigured ? 'Connected to Remote Supabase' : 'Offline / Standalone Preview Active'}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {isSupabaseConfigured
                ? 'Your app is directly executing queries, Row Level Security, and storage operations on your Supabase PostgreSQL database.'
                : 'Full CRUD operations, auth sessions, and storage are actively simulated locally with persistence. Connect your Supabase project credentials anytime below.'}
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Supabase Project URL
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Found under Project Settings &rarr; API &rarr; Project URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Supabase Anon Key (Public)
            </label>
            <div className="relative">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Found under Project Settings &rarr; API &rarr; Project API keys (anon / public)
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              Clear Custom Keys
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Connect Supabase
              </button>
            </div>
          </div>
        </form>

        {/* Quick Database Setup Guide */}
        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-400 space-y-2">
          <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-500" />
            Supabase Schema Script Ready
          </div>
          <p>
            The complete migration script with tables (<code className="text-indigo-600 dark:text-indigo-400 font-mono">profiles</code>, <code className="text-indigo-600 dark:text-indigo-400 font-mono">posts</code>, <code className="text-indigo-600 dark:text-indigo-400 font-mono">comments</code>), RLS policies, trigger functions, and storage bucket configuration is located at <code className="font-mono text-stone-900 dark:text-stone-100">supabase/schema.sql</code>.
          </p>
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={resetDemoData}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Local Demo Database
            </button>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
            >
              Open Supabase Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
};
