import { Post, PostFilterOptions, UserRole, DashboardMetrics } from '../types/blog';
import { supabase } from '../lib/supabase';
import { generateSlug } from '../lib/utils';

export const postsService = {
  /**
   * Fetch posts with optional tag, search, author, and sorting filters.
   * Supabase Row Level Security ensures:
   * - Public readers get only published = true
   * - Writers get published + their own drafts
   * - Admins get all posts
   */
  async getPosts(
    options: PostFilterOptions = {},
    currentUser?: { id: string; role: UserRole } | null
  ): Promise<Post[]> {
    const { tag, search, authorId, publishedOnly, sortBy = 'newest' } = options;

    let query = supabase.from('posts').select(`
      *,
      author_profile:profiles(*)
    `);

    // Visibility / RLS conditions
    if (publishedOnly || !currentUser) {
      query = query.eq('published', true);
    } else if (currentUser.role === 'admin') {
      if (authorId) query = query.eq('author', authorId);
    } else {
      if (authorId) {
        query = query.eq('author', authorId);
      } else if (currentUser.role === 'writer') {
        query = query.or(`published.eq.true,author.eq.${currentUser.id}`);
      } else {
        query = query.eq('published', true);
      }
    }

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
    else if (sortBy === 'oldest') query = query.order('created_at', { ascending: true });
    else if (sortBy === 'title-asc') query = query.order('title', { ascending: true });
    else if (sortBy === 'title-desc') query = query.order('title', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase posts query error:', error.message);
      return [];
    }

    let results = (data || []) as Post[];

    // If search term is present, filter by title, excerpt, tags
    if (search && search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.markdown?.toLowerCase().includes(q)
      );
    }

    return results;
  },

  /**
   * Fetch a single post by slug
   */
  async getPostBySlug(
    slug: string,
    currentUser?: { id: string; role: UserRole } | null
  ): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author_profile:profiles(*)
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const post = data as Post;

    // RLS guard for unpublished drafts
    if (!post.published) {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== post.author)) {
        return null;
      }
    }

    return post;
  },

  /**
   * Fetch a post by ID (for editing)
   */
  async getPostById(
    id: string,
    currentUser?: { id: string; role: UserRole } | null
  ): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, author_profile:profiles(*)`)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const post = data as Post;
    if (!post.published && (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== post.author))) {
      return null;
    }

    return post;
  },

  /**
   * Create a new post in Supabase
   */
  async createPost(
    postData: Omit<Post, 'id' | 'author' | 'created_at' | 'updated_at'>,
    authorId: string
  ): Promise<Post> {
    let slug = postData.slug?.trim() || generateSlug(postData.title);
    if (!slug) slug = `post-${Date.now()}`;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author: authorId,
        title: postData.title,
        slug,
        markdown: postData.markdown,
        published: Boolean(postData.published),
        tags: postData.tags || [],
        featured_image: postData.featured_image || null,
        excerpt: postData.excerpt || null,
        published_at: postData.published ? now : null,
      })
      .select(`*, author_profile:profiles(*)`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Post;
  },

  /**
   * Update an existing post in Supabase (enforces RLS)
   */
  async updatePost(
    id: string,
    postData: Partial<Post>,
    currentUser: { id: string; role: UserRole }
  ): Promise<Post> {
    const existing = await this.getPostById(id, currentUser);
    if (!existing) {
      throw new Error('Post not found or you do not have permission to edit it.');
    }

    // Role verification: Writer can only edit own post; Admin can edit any
    if (currentUser.role !== 'admin' && existing.author !== currentUser.id) {
      throw new Error('Unauthorized: You can only edit your own posts.');
    }

    const now = new Date().toISOString();
    const willBePublished =
      postData.published !== undefined ? postData.published : existing.published;
    const published_at =
      !existing.published && willBePublished
        ? now
        : postData.published === false
        ? null
        : existing.published_at;

    const { data, error } = await supabase
      .from('posts')
      .update({
        ...postData,
        updated_at: now,
        published_at,
      })
      .eq('id', id)
      .select(`*, author_profile:profiles(*)`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Post;
  },

  /**
   * Delete a post from Supabase
   */
  async deletePost(
    id: string,
    currentUser: { id: string; role: UserRole }
  ): Promise<boolean> {
    const existing = await this.getPostById(id, currentUser);
    if (!existing) {
      throw new Error('Post not found or permission denied.');
    }

    if (currentUser.role !== 'admin' && existing.author !== currentUser.id) {
      throw new Error('Unauthorized: You can only delete your own posts.');
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  /**
   * Quick toggle publish / unpublish status
   */
  async togglePublish(
    id: string,
    published: boolean,
    currentUser: { id: string; role: UserRole }
  ): Promise<Post> {
    return this.updatePost(
      id,
      {
        published,
        published_at: published ? new Date().toISOString() : null,
      },
      currentUser
    );
  },

  /**
   * Calculate aggregated metrics for dashboards
   */
  async getDashboardMetrics(
    authorId?: string,
    isAdmin?: boolean
  ): Promise<DashboardMetrics> {
    try {
      let query = supabase.from('posts').select('id, published, author');

      if (!isAdmin && authorId) {
        query = query.eq('author', authorId);
      }

      const { data: posts, error: postsErr } = await query;
      if (postsErr) throw postsErr;

      const postList = posts || [];
      const totalPosts = postList.length;
      const publishedPosts = postList.filter((p) => p.published).length;
      const draftPosts = totalPosts - publishedPosts;

      // Count comments for these posts
      let totalComments = 0;
      if (postList.length > 0) {
        const postIds = postList.map((p) => p.id);
        const { count, error: countErr } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .in('post_id', postIds);
        if (!countErr && count !== null) {
          totalComments = count;
        }
      }

      let totalUsers: number | undefined;
      if (isAdmin) {
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        totalUsers = usersCount ?? undefined;
      }

      return {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalComments,
        totalUsers,
      };
    } catch (e) {
      console.warn('Error fetching metrics from Supabase:', e);
      return {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalComments: 0,
        totalUsers: isAdmin ? 0 : undefined,
      };
    }
  },
};
