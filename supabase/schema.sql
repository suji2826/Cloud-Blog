-- ==============================================================================
-- CloudBlog – Complete Production Supabase Database Schema
-- ==============================================================================
-- Paste and run this ENTIRE script in the Supabase SQL Editor.
-- It configures:
--   1. Extensions (uuid-ossp, pgcrypto)
--   2. Profiles, Posts, and Comments tables
--   3. Performance & GIN indexes
--   4. Trigger to auto-create public.profiles upon auth.users signup
--   5. Automatic updated_at timestamps
--   6. Storage bucket 'blog-images' & storage RLS policies
--   7. Comprehensive Row Level Security (RLS) policies for all roles
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. TABLES & RELATIONSHIPS
-- ------------------------------------------------------------------------------

-- Profiles Table (1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'writer' CHECK (role IN ('admin', 'writer', 'reader')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts Table (author -> profiles.id)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Comments Table (post_id -> posts.id, user_id -> profiles.id)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);

-- ------------------------------------------------------------------------------
-- 4. AUTO-UPDATE UPDATED_AT TRIGGER
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
-- 5. AUTO-CREATE PROFILE ON AUTH.USERS SIGNUP TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name TEXT;
    user_role TEXT;
    avatar TEXT;
BEGIN
    default_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'writer'
    );
    avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        'https://api.dicebear.com/7.x/initials/svg?seed=' || default_name
    );

    INSERT INTO public.profiles (id, display_name, role, avatar_url)
    VALUES (NEW.id, default_name, user_role, avatar)
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
-- 6. ADMIN HELPER FUNCTION
-- ------------------------------------------------------------------------------
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
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to allow clean idempotency
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

DROP POLICY IF EXISTS "Public users can view published posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can view own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Writers can insert own posts" ON public.posts;
DROP POLICY IF EXISTS "Writers can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.posts;
DROP POLICY IF EXISTS "Writers can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;

DROP POLICY IF EXISTS "Public can view comments on published posts" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.comments;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_admin());

-- Posts Policies
CREATE POLICY "Public users can view published posts"
    ON public.posts FOR SELECT
    USING (published = true);

CREATE POLICY "Authors can view own posts"
    ON public.posts FOR SELECT
    USING (auth.uid() = author);

CREATE POLICY "Admins can view all posts"
    ON public.posts FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Writers can insert own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = author);

CREATE POLICY "Writers can update own posts"
    ON public.posts FOR UPDATE
    USING (auth.uid() = author);

CREATE POLICY "Admins can update any post"
    ON public.posts FOR UPDATE
    USING (public.is_admin());

CREATE POLICY "Writers can delete own posts"
    ON public.posts FOR DELETE
    USING (auth.uid() = author);

CREATE POLICY "Admins can delete any post"
    ON public.posts FOR DELETE
    USING (public.is_admin());

-- Comments Policies
CREATE POLICY "Public can view comments on published posts"
    ON public.comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = comments.post_id AND posts.published = true
        )
    );

CREATE POLICY "Authenticated users can create comments"
    ON public.comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
    ON public.comments FOR DELETE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. STORAGE BUCKET: blog-images & POLICIES
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access to Blog Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Upload Blog Images" ON storage.objects;
DROP POLICY IF EXISTS "Users Update Own Blog Images" ON storage.objects;
DROP POLICY IF EXISTS "Users Delete Own Blog Images" ON storage.objects;

-- Anyone can view uploaded blog images
CREATE POLICY "Public Access to Blog Images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'blog-images');

-- Authenticated users can upload to the blog-images bucket
CREATE POLICY "Authenticated Users Upload Blog Images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'blog-images' AND
        auth.role() = 'authenticated'
    );

-- Authors can update and delete their own uploads
CREATE POLICY "Users Update Own Blog Images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'blog-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users Delete Own Blog Images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'blog-images' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            public.is_admin()
        )
    );
