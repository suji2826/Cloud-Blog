import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/blog';
import { supabase, supabaseConfig, localStore } from '../lib/supabase';
import { profilesService } from '../services/profilesService';

export interface AuthContextType {
  user: { id: string; email: string; profile: Profile } | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  setCustomSupabaseConfig: (url: string, key: string) => void;
  resetDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string; profile: Profile } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(supabaseConfig.isConfigured);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      // 1. Try real Supabase auth if configured
      if (supabase && supabaseConfig.isConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            const sbUser = data.session.user;
            const profile = await profilesService.getProfile(sbUser.id);
            if (profile) {
              setUser({
                id: sbUser.id,
                email: sbUser.email || '',
                profile,
              });
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Supabase auth session check failed:', e);
        }
      }

      // 2. Load from local store
      const localUser = localStore.getCurrentUser();
      if (localUser) {
        setUser(localUser);
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen to Supabase auth events if connected
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const profile = await profilesService.getProfile(session.user.id);
          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              profile,
            });
          }
        } else {
          setUser(null);
        }
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const signUp = async (displayName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              role: 'writer',
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          // Trigger creates profile, fetch it
          let prof = await profilesService.getProfile(data.user.id);
          if (!prof) {
            prof = {
              id: data.user.id,
              display_name: displayName,
              role: 'writer',
              avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            localStore.saveProfile(prof);
          }
          const newUser = { id: data.user.id, email: data.user.email || email, profile: prof };
          setUser(newUser);
          localStore.setCurrentUser(newUser);
        }
        return;
      }

      // Local / Offline store registration
      const newId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newProfile: Profile = {
        id: newId,
        display_name: displayName,
        role: 'writer', // default role
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      localStore.saveProfile(newProfile);
      const newUser = { id: newId, email, profile: newProfile };
      localStore.setCurrentUser(newUser);
      setUser(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (supabase && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          const profile = await profilesService.getProfile(data.user.id);
          if (profile) {
            const authUser = { id: data.user.id, email: data.user.email || email, profile };
            setUser(authUser);
            localStore.setCurrentUser(authUser);
          }
        }
        return;
      }

      // Local sign-in: check existing profiles or match seed users
      const profiles = localStore.getProfiles();
      const matched = profiles.find((p) => {
        if (email.toLowerCase().includes('admin') && p.role === 'admin') return true;
        if (email.toLowerCase().includes('writer') && p.role === 'writer') return true;
        if (email.toLowerCase().includes('reader') && p.role === 'reader') return true;
        return p.display_name.toLowerCase() === email.split('@')[0].toLowerCase();
      }) || profiles[1]; // default to writer

      const authUser = {
        id: matched.id,
        email: email || `${matched.display_name.toLowerCase().replace(/\s+/g, '')}@cloudblog.io`,
        profile: matched,
      };
      localStore.setCurrentUser(authUser);
      setUser(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStore.setCurrentUser(null);
    setUser(null);
  };

  const switchDemoRole = (targetRole: UserRole) => {
    const profiles = localStore.getProfiles();
    const match = profiles.find((p) => p.role === targetRole) || profiles[0];
    const emailMap: Record<UserRole, string> = {
      admin: 'admin@cloudblog.io',
      writer: 'writer@cloudblog.io',
      reader: 'reader@cloudblog.io',
    };
    const newUser = {
      id: match.id,
      email: emailMap[targetRole],
      profile: match,
    };
    localStore.setCurrentUser(newUser);
    setUser(newUser);
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) throw new Error('Not authenticated');
    const updated = await profilesService.updateProfile(user.id, data, {
      id: user.id,
      role: user.profile.role,
    });
    setUser({ ...user, profile: updated });
  };

  const setCustomSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('CLOUDBLOG_SUPABASE_URL', url);
    localStorage.setItem('CLOUDBLOG_SUPABASE_KEY', key);
    window.location.reload();
  };

  const resetDemoData = () => {
    localStore.resetToDefaults();
    window.location.reload();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user?.profile || null,
        role: user?.profile?.role || 'reader',
        isLoading,
        isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        switchDemoRole,
        updateProfile,
        setCustomSupabaseConfig,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
