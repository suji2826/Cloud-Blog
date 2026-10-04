export type UserRole = 'admin' | 'writer' | 'reader';

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  author: string;
  title: string;
  slug: string;
  markdown: string;
  published: boolean;
  tags: string[];
  featured_image?: string;
  excerpt?: string;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  author_profile?: Profile;
  comment_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  user_profile?: Profile;
}

export interface PostFilterOptions {
  tag?: string;
  search?: string;
  authorId?: string;
  publishedOnly?: boolean;
  sortBy?: 'newest' | 'oldest' | 'title-asc' | 'title-desc';
}

export interface DashboardMetrics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalComments: number;
  totalUsers?: number;
}
