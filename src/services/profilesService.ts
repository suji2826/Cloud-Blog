import { Profile, UserRole } from '../types/blog';
import { supabase } from '../lib/supabase';

export const profilesService = {
  async getProfile(id: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile from Supabase:', error.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error('Exception fetching profile:', e);
      return null;
    }
  },

  async getAllProfiles(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching all profiles:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('Exception fetching profiles:', e);
      return [];
    }
  },

  async updateProfile(
    id: string,
    data: Partial<Profile>,
    currentUser: { id: string; role: UserRole }
  ): Promise<Profile> {
    // RLS Enforcement: only user themselves or admin can update
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      throw new Error('Unauthorized: You can only update your own profile.');
    }

    // Role escalation prevention: non-admin cannot alter role
    if (data.role && data.role !== currentUser.role && currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can modify roles.');
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return updated;
  },
};
