import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/blog';
import { supabase, supabaseConfig } from '../lib/supabase';
import { profilesService } from '../services/profilesService';

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  setCustomSupabaseConfig: (url: string, key: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = supabaseConfig.isConfigured;

  // Sync profile from Supabase
  const syncUserProfile = async (userId: string, email: string, metadata?: any): Promise<AuthUser> => {
    try {
      let prof = await profilesService.getProfile(userId);
      if (!prof) {
        // Fallback: create initial profile record if trigger has not executed
        const displayName = metadata?.display_name || email.split('@')[0] || 'User';
        const newProfile: Profile = {
          id: userId,
          display_name: displayName,
          role: 'writer', // default role
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: created, error } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();

        prof = error ? newProfile : (created as Profile);
      }

      return {
        id: userId,
        email,
        profile: prof,
      };
    } catch (e) {
      console.error('Error syncing user profile:', e);
      const fallbackProf: Profile = {
        id: userId,
        display_name: metadata?.display_name || email.split('@')[0] || 'User',
        role: 'writer',
      };
      return { id: userId, email, profile: fallbackProf };
    }
  };

  // Initial session check & auth state listener
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase getSession warning:', error.message);
          if (isMounted) setUser(null);
          return;
        }

        if (data.session?.user && isMounted) {
          const u = data.session.user;
          const authUser = await syncUserProfile(u.id, u.email || '', u.user_metadata);
          if (isMounted) setUser(authUser);
        } else if (isMounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initSession();

    // Subscribe to real Supabase auth state change events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const authUser = await syncUserProfile(u.id, u.email || '', u.user_metadata);
        if (isMounted) setUser(authUser);
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Real Supabase sign up
  const signUp = async (displayName: string, email: string, password: string) => {
    setIsLoading(true);
    try {
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
        const authUser = await syncUserProfile(data.user.id, data.user.email || email, {
          display_name: displayName,
        });
        setUser(authUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real Supabase sign in with password
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const authUser = await syncUserProfile(
          data.user.id,
          data.user.email || email,
          data.user.user_metadata
        );
        setUser(authUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Real Supabase sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (e) {
      console.error('Error signing out:', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user?.profile || null,
        role: user?.profile?.role || 'reader',
        isLoading,
        isConfigured,
        signUp,
        signIn,
        signOut,
        updateProfile,
        setCustomSupabaseConfig,
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
