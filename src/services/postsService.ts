import { Post, PostFilterOptions, UserRole, DashboardMetrics } from '../types/blog';
import { supabase, localStore } from '../lib/supabase';
import { generateSlug } from '../lib/utils';

export const postsService = {
  /**
   * Fetch posts with optional tag, search, author, and sorting filters.
   * Enforces Row Level Security:
   * - Public readers get only published = true
   * - Writers get published + their own drafts
   * - Admins get all posts
   */
  async getPosts(
    options: PostFilterOptions = {},
    currentUser?: { id: string; role: UserRole } | null
  ): Promise<Post[]> {
    const { tag, search, authorId, publishedOnly, sortBy = 'newest' } = options;

    if (supabase) {
      let query = supabase.from('posts').select(`
        *,
        author_profile:profiles(*)
      `);

      // RLS filter
      if (publishedOnly || !currentUser) {
        query = query.eq('published', true);
      } else if (currentUser.role === 'admin') {
        if (authorId) query = query.eq('author', authorId);
      } else {
        // Writer or reader
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
      if (!error && data) {
        let results = data as Post[];
        if (search && search.trim()) {
          const q = search.toLowerCase();
          results = results.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
              p.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return results;
      }
      console.warn('Supabase posts fetch failed, falling back to local store:', error);
    }

    // Local Store execution with RLS enforcement
    let posts = localStore.getPosts();
    const profiles = localStore.getProfiles();
    const comments = localStore.getComments();

    // Attach author profile & comment count
    let mapped: Post[] = posts.map((post) => ({
      ...post,
      author_profile: profiles.find((p) => p.id === post.author),
      comment_count: comments.filter((c) => c.post_id === post.id).length,
    }));

    // Row Level Security check
    if (publishedOnly || !currentUser) {
      mapped = mapped.filter((p) => p.published);
    } else if (currentUser.role === 'admin') {
      if (authorId) mapped = mapped.filter((p) => p.author === authorId);
    } else {
      // Writer / reader
      if (authorId) {
        mapped = mapped.filter((p) => p.author === authorId && (p.published || p.author === currentUser.id));
      } else if (currentUser.role === 'writer') {
        mapped = mapped.filter((p) => p.published || p.author === currentUser.id);
      } else {
        mapped = mapped.filter((p) => p.published);
      }
    }

    // Tag filter
    if (tag) {
      const targetTag = tag.toLowerCase();
      mapped = mapped.filter((p) => p.tags.some((t) => t.toLowerCase() === targetTag));
    }

    // Search filter
    if (search && search.trim()) {
      const q = search.toLowerCase();
      mapped = mapped.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.markdown.toLowerCase().includes(q)
      );
    }

    // Sorting
    mapped.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return mapped;
  },

  /**
   * Fetch a single post by slug
   */
  async getPostBySlug(
    slug: string,
    currentUser?: { id: string; role: UserRole } | null
  ): Promise<Post | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author_profile:profiles(*)
        `)
        .eq('slug', slug)
        .single();

      if (!error && data) {
        const post = data as Post;
        // RLS check
        if (!post.published) {
          if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== post.author)) {
            return null;
          }
        }
        return post;
      }
    }

    const posts = localStore.getPosts();
    const found = posts.find((p) => p.slug === slug);
    if (!found) return null;

    // RLS check
    if (!found.published) {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== found.author)) {
        return null;
      }
    }

    const profiles = localStore.getProfiles();
    const comments = localStore.getComments();
    return {
      ...found,
      author_profile: profiles.find((p) => p.id === found.author),
      comment_count: comments.filter((c) => c.post_id === found.id).length,
    };
  },

  /**
   * Fetch a post by ID (for editing)
   */
  async getPostById(
    id: string,
    currentUser?: { id: string; role: UserRole } | null
  ): Promise<Post | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, author_profile:profiles(*)`)
        .eq('id', id)
        .single();
      if (!error && data) {
        const post = data as Post;
        if (!post.published && (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== post.author))) {
          return null;
        }
        return post;
      }
    }

    const posts = localStore.getPosts();
    const found = posts.find((p) => p.id === id);
    if (!found) return null;

    if (!found.published && (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== found.author))) {
      return null;
    }

    const profiles = localStore.getProfiles();
    const comments = localStore.getComments();
    return {
      ...found,
      author_profile: profiles.find((p) => p.id === found.author),
      comment_count: comments.filter((c) => c.post_id === found.id).length,
    };
  },

  /**
   * Create a new post
   */
  async createPost(
    postData: Omit<Post, 'id' | 'author' | 'created_at' | 'updated_at'>,
    authorId: string
  ): Promise<Post> {
    let slug = postData.slug?.trim() || generateSlug(postData.title);
    if (!slug) slug = `post-${Date.now()}`;

    // Ensure unique slug
    const existingPosts = localStore.getPosts();
    let uniqueSlug = slug;
    let counter = 1;
    while (existingPosts.some((p) => p.slug === uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const now = new Date().toISOString();
    const newPost: Post = {
      ...postData,
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      author: authorId,
      slug: uniqueSlug,
      created_at: now,
      updated_at: now,
      published_at: postData.published ? now : null,
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author: authorId,
          title: postData.title,
          slug: uniqueSlug,
          markdown: postData.markdown,
          published: Boolean(postData.published),
          tags: postData.tags || [],
          featured_image: postData.featured_image || null,
          excerpt: postData.excerpt || null,
          published_at: postData.published ? now : null,
        })
        .select()
        .single();

      if (!error && data) {
        return data as Post;
      }
      console.warn('Supabase post creation error, fallback to localStore:', error);
    }

    const saved = localStore.savePost(newPost);
    return saved;
  },

  /**
   * Update an existing post (enforces RLS)
   */
  async updatePost(
    id: string,
    postData: Partial<Post>,
    currentUser: { id: string; role: UserRole }
  ): Promise<Post> {
    const existing = await this.getPostById(id, currentUser);
    if (!existing) {
      throw new Error('Post not found or you do not have permission to view it.');
    }

    // RLS Enforcement: Writer can only edit own post; Admin can edit any
    if (currentUser.role !== 'admin' && existing.author !== currentUser.id) {
      throw new Error('Unauthorized: You can only edit your own posts.');
    }

    const now = new Date().toISOString();
    const wasPublished = existing.published;
    const willBePublished = postData.published !== undefined ? postData.published : wasPublished;
    const published_at = !wasPublished && willBePublished ? now : existing.published_at;

    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...postData,
          updated_at: now,
          published_at: willBePublished ? published_at || now : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Post;
      }
    }

    const updated = localStore.savePost({
      ...existing,
      ...postData,
      updated_at: now,
      published_at: willBePublished ? published_at || now : null,
    });
    return updated;
  },

  /**
   * Delete a post (enforces RLS and cascades to comments)
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

    if (supabase) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    }

    return localStore.deletePost(id);
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
    const posts = localStore.getPosts();
    const comments = localStore.getComments();
    const profiles = localStore.getProfiles();

    let filteredPosts = posts;
    if (!isAdmin && authorId) {
      filteredPosts = posts.filter((p) => p.author === authorId);
    }

    const totalPosts = filteredPosts.length;
    const publishedPosts = filteredPosts.filter((p) => p.published).length;
    const draftPosts = totalPosts - publishedPosts;

    const postIds = new Set(filteredPosts.map((p) => p.id));
    const totalComments = comments.filter((c) => postIds.has(c.post_id)).length;

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalComments,
      totalUsers: isAdmin ? profiles.length : undefined,
    };
  },
};
