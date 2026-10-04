-- ==============================================================================
-- CloudBlog – Supabase PostgreSQL Database Schema & Row Level Security (RLS)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to bootstrap the complete database:
-- 1. Tables: profiles, posts, comments
-- 2. Performance indexes
-- 3. Row Level Security (RLS) policies
-- 4. Automatic profile creation trigger on signup
-- 5. Updated_at auto-updating triggers
-- 6. Storage bucket 'blog-images' & storage policies
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'writer' CHECK (role IN ('admin', 'writer', 'reader')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. POSTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    markdown TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    featured_image TEXT,
    excerpt TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 3. COMMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON public.posts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);

-- ------------------------------------------------------------------------------
-- 5. UPDATED_AT TRIGGER FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_posts_updated_at ON public.posts;
CREATE TRIGGER trigger_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON public.comments;
CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. AUTOMATIC PROFILE CREATION TRIGGER (ON AUTH.USERS INSERT)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_display_name TEXT;
    assigned_role TEXT;
BEGIN
    default_display_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    assigned_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'writer'
    );

    INSERT INTO public.profiles (id, display_name, role, avatar_url)
    VALUES (
        NEW.id,
        default_display_name,
        assigned_role,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 8. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone (public or authenticated) can view author/user profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update only their own profile (cannot escalate role to admin unless existing admin)
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND (
            role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
        )
    );

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. POSTS POLICIES
-- ------------------------------------------------------------------------------
-- Public users can read published posts
CREATE POLICY "Public users can view published posts"
    ON public.posts
    FOR SELECT
    USING (published = true);

-- Writers and authors can view their own posts (even drafts)
CREATE POLICY "Authors can view own posts"
    ON public.posts
    FOR SELECT
    USING (auth.uid() = author);

-- Admins can view all posts (published or drafts)
CREATE POLICY "Admins can view all posts"
    ON public.posts
    FOR SELECT
    USING (public.is_admin());

-- Writers can create posts with their own author ID
CREATE POLICY "Writers can insert own posts"
    ON public.posts
    FOR INSERT
    WITH CHECK (auth.uid() = author);

-- Writers can update only their own posts
CREATE POLICY "Writers can update own posts"
    ON public.posts
    FOR UPDATE
    USING (auth.uid() = author)
    WITH CHECK (auth.uid() = author);

-- Admins can update any post
CREATE POLICY "Admins can update any post"
    ON public.posts
    FOR UPDATE
    USING (public.is_admin());

-- Writers can delete only their own posts
CREATE POLICY "Writers can delete own posts"
    ON public.posts
    FOR DELETE
    USING (auth.uid() = author);

-- Admins can delete any post
CREATE POLICY "Admins can delete any post"
    ON public.posts
    FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 10. COMMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Public users can view comments on published posts
CREATE POLICY "Public can view comments on published posts"
    ON public.comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = comments.post_id AND posts.published = true
        )
    );

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can create comments"
    ON public.comments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own comments
CREATE POLICY "Users can update own comments"
    ON public.comments
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own comments
CREATE POLICY "Users can delete own comments"
    ON public.comments
    FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can delete any comment (moderation)
CREATE POLICY "Admins can delete any comment"
    ON public.comments
    FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 11. SUPABASE STORAGE: blog-images BUCKET & POLICIES
-- ------------------------------------------------------------------------------
-- Create bucket 'blog-images' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public can view images
CREATE POLICY "Public can view blog images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'blog-images');

-- Authenticated writers can upload images to their user folder: userId/*
CREATE POLICY "Authenticated users can upload blog images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'blog-images' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Users can update their own images
CREATE POLICY "Users can update own blog images"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'blog-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own uploaded images
CREATE POLICY "Users can delete own blog images"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'blog-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
