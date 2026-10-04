import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/utils';
import { User, Mail, Shield, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, role, updateProfile } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(user?.profile.display_name || '');
  const [bio, setBio] = useState(user?.profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">
          Sign In Required
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          Please sign in to view and manage your profile settings.
        </p>
        <button
          onClick={() => onNavigate('/login')}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast('Display name cannot be empty.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      toast('Profile updated successfully!', 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayName || 'User')}`,
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Profile Settings
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Manage your personal information, public avatar, and bio.
        </p>
      </div>

      <div className="p-8 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-8">
        {/* Top Avatar Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-stone-100 dark:border-stone-800">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-3xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                {displayName}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Shield className="w-3 h-3" />
                {role}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5" />
              {user.email}
            </p>
            <p className="text-xs text-stone-400">
              Member since {formatDate(user.profile.created_at)}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Email (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Email Address (Protected)
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 text-stone-500 dark:text-stone-400 cursor-not-allowed"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Registered email associated with your Supabase auth account.
            </p>
          </div>

          {/* Role (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={role.toUpperCase()}
                disabled
                className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 text-stone-600 dark:text-stone-300 cursor-not-allowed uppercase"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Roles are protected by PostgreSQL RLS. Users cannot alter their own permission tier.
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Biography
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell readers about your technical background and writing interests..."
              className="w-full p-3 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Avatar URL & Presets */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
              Avatar Image URL
            </label>
            <div className="relative mb-3">
              <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Or pick preset:</span>
              <div className="flex items-center gap-1.5">
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className="w-7 h-7 rounded-full overflow-hidden border border-stone-300 hover:border-indigo-500 cursor-pointer"
                  >
                    <img src={preset} alt="preset" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
