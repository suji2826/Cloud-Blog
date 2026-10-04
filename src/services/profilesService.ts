import { Profile, UserRole } from '../types/blog';
import { supabase, localStore } from '../lib/supabase';

export const profilesService = {
  async getProfile(id: string): Promise<Profile | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('Error fetching profile from Supabase:', error);
        return localStore.getProfile(id) || null;
      }
      return data;
    }
    return localStore.getProfile(id) || null;
  },

  async getAllProfiles(): Promise<Profile[]> {
    if (supabase) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Error fetching profiles from Supabase:', error);
        return localStore.getProfiles();
      }
      return data || [];
    }
    return localStore.getProfiles();
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

    if (supabase) {
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
    }

    const existing = localStore.getProfile(id);
    if (!existing) {
      throw new Error('Profile not found');
    }

    const updated = localStore.saveProfile({
      ...existing,
      ...data,
    });
    return updated;
  },
};
