import { Comment, UserRole } from '../types/blog';
import { supabase } from '../lib/supabase';

export const commentsService = {
  /**
   * Get all comments for a post from Supabase
   */
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`*, user_profile:profiles(*)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Error fetching comments from Supabase:', error.message);
      return [];
    }

    return (data || []) as Comment[];
  },

  /**
   * Admin view: get all comments across the entire platform
   */
  async getAllComments(): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`*, user_profile:profiles(*)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching all comments from Supabase:', error.message);
      return [];
    }

    return (data || []) as Comment[];
  },

  /**
   * Create a comment
   */
  async createComment(postId: string, userId: string, body: string): Promise<Comment> {
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Comment body cannot be empty.');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        body: trimmed,
      })
      .select(`*, user_profile:profiles(*)`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Comment;
  },

  /**
   * Update own comment
   */
  async updateComment(
    id: string,
    body: string,
    currentUser: { id: string; role: UserRole }
  ): Promise<Comment> {
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Comment body cannot be empty.');

    const { data, error } = await supabase
      .from('comments')
      .update({
        body: trimmed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`*, user_profile:profiles(*)`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Comment;
  },

  /**
   * Delete comment (user own comment or admin moderation)
   */
  async deleteComment(
    id: string,
    currentUser: { id: string; role: UserRole }
  ): Promise<boolean> {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },
};
