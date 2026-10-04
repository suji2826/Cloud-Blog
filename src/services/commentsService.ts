import { Comment, UserRole } from '../types/blog';
import { supabase, localStore } from '../lib/supabase';

export const commentsService = {
  /**
   * Get all comments for a post
   */
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('comments')
        .select(`*, user_profile:profiles(*)`)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return data as Comment[];
      }
    }

    const comments = localStore.getComments().filter((c) => c.post_id === postId);
    const profiles = localStore.getProfiles();

    return comments
      .map((c) => ({
        ...c,
        user_profile: profiles.find((p) => p.id === c.user_id),
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  /**
   * Admin view: get all comments across the entire platform
   */
  async getAllComments(): Promise<Comment[]> {
    if (supabase) {
      const { data, error } = await supabase
        .from('comments')
        .select(`*, user_profile:profiles(*)`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Comment[];
      }
    }

    const comments = localStore.getComments();
    const profiles = localStore.getProfiles();
    return comments
      .map((c) => ({
        ...c,
        user_profile: profiles.find((p) => p.id === c.user_id),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Create a comment
   */
  async createComment(postId: string, userId: string, body: string): Promise<Comment> {
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Comment body cannot be empty.');

    const now = new Date().toISOString();
    const newComment: Comment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      post_id: postId,
      user_id: userId,
      body: trimmed,
      created_at: now,
      updated_at: now,
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: userId,
          body: trimmed,
        })
        .select(`*, user_profile:profiles(*)`)
        .single();

      if (!error && data) {
        return data as Comment;
      }
    }

    const saved = localStore.saveComment(newComment);
    const profiles = localStore.getProfiles();
    return {
      ...saved,
      user_profile: profiles.find((p) => p.id === userId),
    };
  },

  /**
   * Update own comment
   */
  async updateComment(
    id: string,
    body: string,
    currentUser: { id: string; role: UserRole }
  ): Promise<Comment> {
    const comments = localStore.getComments();
    const existing = comments.find((c) => c.id === id);
    if (!existing) throw new Error('Comment not found.');

    if (currentUser.role !== 'admin' && existing.user_id !== currentUser.id) {
      throw new Error('Unauthorized: You can only edit your own comment.');
    }

    const now = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('comments')
        .update({
          body: body.trim(),
          updated_at: now,
        })
        .eq('id', id)
        .select(`*, user_profile:profiles(*)`)
        .single();

      if (!error && data) {
        return data as Comment;
      }
    }

    const updated = localStore.saveComment({
      ...existing,
      body: body.trim(),
      updated_at: now,
    });
    const profiles = localStore.getProfiles();
    return {
      ...updated,
      user_profile: profiles.find((p) => p.id === updated.user_id),
    };
  },

  /**
   * Delete comment (user own comment or admin moderation)
   */
  async deleteComment(
    id: string,
    currentUser: { id: string; role: UserRole }
  ): Promise<boolean> {
    const comments = localStore.getComments();
    const existing = comments.find((c) => c.id === id);
    if (!existing) throw new Error('Comment not found.');

    if (currentUser.role !== 'admin' && existing.user_id !== currentUser.id) {
      throw new Error('Unauthorized: You can only delete your own comments.');
    }

    if (supabase) {
      const { error } = await supabase.from('comments').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }

    return localStore.deleteComment(id);
  },
};
