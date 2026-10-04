# CloudBlog – Cloud-Based Blogging Platform

A complete, production-quality, internship-level cloud-powered blogging platform built with **React / Next.js architecture**, **Supabase Authentication**, **PostgreSQL with Row Level Security (RLS)**, **Supabase Cloud Storage**, and **Live Markdown Editing**.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Application Architecture](#application-architecture)
- [Technology Stack](#technology-stack)
- [Database Schema & Migrations](#database-schema--migrations)
- [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
- [Authentication & User Roles](#authentication--user-roles)
- [Cloud Storage Setup](#cloud-storage-setup)
- [Installation & Local Development](#installation--local-development)
- [Environment Variables](#environment-variables)
- [Supabase Setup Guide](#supabase-setup-guide)
- [Vercel Deployment Guide](#vercel-deployment-guide)
- [Project Structure](#project-structure)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)
- [Verification & Testing Checklist](#verification--testing-checklist)

---

## Project Overview

CloudBlog empowers creators, technical authors, and communities to write, publish, and engage with content in a secure, cloud-native environment. Data integrity and multi-tenant isolation are enforced at the database kernel level using PostgreSQL Row Level Security (RLS), preventing unauthorized content modifications even under adverse conditions.

---

## Key Features

1. **Multi-Role Access Control (RBAC)**:
   - **Admin**: Platform oversight, manage and edit any post, moderate comments, publish/unpublish any article, view system metrics.
   - **Writer**: Create and draft posts, live split markdown editor, publish/unpublish own stories, image uploads, edit own profile.
   - **Reader**: Browse published articles, search by title/tags/content, filter by topic, comment on articles, edit/delete own comments.

2. **Database-Kernel Row Level Security**:
   - PostgreSQL RLS enabled on `profiles`, `posts`, and `comments`.
   - Security definer functions (`public.is_admin()`, `public.handle_new_user()`, `public.handle_updated_at()`).

3. **Split-Screen Markdown Editor**:
   - Left-pane GitHub-Flavored Markdown (GFM) authoring with formatting toolbar (Headings, Bold, Italic, Code Blocks, Quotes, Lists, Links, Images).
   - Right-pane live synchronized preview.
   - Syntax-highlighted code blocks with one-click clipboard copying.
   - Automatic estimated reading time calculation (words per minute).

4. **Image Upload with Supabase Storage**:
   - Direct integration with Supabase Storage bucket `blog-images`.
   - Path convention: `userId/postId/filename`.
   - Client-side MIME validation (JPG, JPEG, PNG, WEBP) and file size limitation (< 5MB).
   - Real-time progress percentage bar.

5. **Search & Tag Categorization**:
   - Instant search across article titles, excerpts, tags, and content.
   - Tag chip filters with article counts and dedicated `/tags` directory.
   - Sorting options: Newest, Oldest, A–Z, Z–A.

6. **Interactive Community Comments**:
   - Authenticated comment submissions on published articles.
   - Authors can edit and delete their own comments.
   - Administrators have moderation privileges to remove flagged comments.

7. **SEO & Search Crawler Readiness**:
   - `public/robots.txt` allowing public articles while blocking private dashboards.
   - `public/sitemap.xml` indexing published articles (excluding drafts).
   - Dynamic HTML meta tags, OpenGraph, and Twitter social cards.

8. **Theme & Responsiveness**:
   - Dark / Light / System theme modes persisted in `localStorage`.
   - Mobile navigation drawer with responsive tables and touch-friendly controls.

---

## Application Architecture

```
User Browser (React + Tailwind CSS)
            │
            ▼
Authentication Layer (Supabase Auth / Session Tokens)
            │
            ▼
PostgreSQL Engine (Supabase / Cloud SQL)
   ├── profiles Table
   ├── posts Table
   └── comments Table
            │
            ▼
Row Level Security (RLS Engine)
   ├── "Public read published posts"
   ├── "Authors update own posts"
   ├── "Admins manage all posts"
   └── "Users update own comments"
            │
            ▼
Cloud Storage Bucket ("blog-images")
            │
            ▼
Production CDN & Hosting (Vercel)
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React
- **Markdown**: `react-markdown`, `remark-gfm`
- **Backend / BaaS**: Supabase (`@supabase/supabase-js`)
- **Database**: PostgreSQL 15+ with `uuid-ossp`
- **Security**: PostgreSQL Row Level Security (RLS) & Triggers
- **Storage**: Supabase Object Storage (`blog-images`)
- **Deployment Target**: Vercel

---

## Database Schema & Migrations

The complete schema is located in `supabase/schema.sql` and `supabase/migrations/20261004000000_cloudblog_schema.sql`.

### 1. `profiles` Table
```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'writer' CHECK (role IN ('admin', 'writer', 'reader')),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. `posts` Table
```sql
CREATE TABLE public.posts (
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
```

### 3. `comments` Table
```sql
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 4. Indexes
- `idx_posts_slug` on `posts(slug)`
- `idx_posts_published` on `posts(published)`
- `idx_posts_author` on `posts(author)`
- `idx_posts_created_at` on `posts(created_at DESC)`
- `idx_comments_post_id` on `comments(post_id)`

---

## Row Level Security (RLS) Policies

RLS is enabled on all tables:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
```

### Posts Policies Summary
- **Public**: `SELECT` allowed only when `published = true`.
- **Writers**: `SELECT`, `INSERT`, `UPDATE`, `DELETE` on rows where `author = auth.uid()`.
- **Admins**: Full access across all posts evaluated via `public.is_admin()`.

### Comments Policies Summary
- **Public**: `SELECT` comments on posts where `post.published = true`.
- **Authenticated Users**: `INSERT` where `user_id = auth.uid()`.
- **Comment Authors**: `UPDATE` and `DELETE` on their own comments.
- **Admins**: `DELETE` any comment for moderation.

---

## Authentication & User Roles

Authentication is handled via Supabase Auth:
- **Sign Up**: Email, password, and display name. Automatic trigger `on_auth_user_created` creates a corresponding `profiles` row with default role `writer`.
- **Sign In**: Supabase session token persistence.
- **Role Enforcement**: UI and service layers enforce role constraints; database RLS ensures role escalation is blocked at the SQL level.

---

## Cloud Storage Setup

1. Bucket Name: `blog-images`
2. Access: Public read enabled.
3. Upload policy:
```sql
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'blog-images' AND auth.role() = 'authenticated'
);
```

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
# Supabase Configuration (Vite)
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"

# Next.js / Vercel Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
```

> **Security Note**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code or browser bundles.

---

## Supabase Setup Guide

1. Sign in to [Supabase](https://supabase.com).
2. Create a new project.
3. Open the **SQL Editor** tab.
4. Paste the entire content of `supabase/schema.sql` and click **Run**.
5. Navigate to **Storage** &rarr; verify the `blog-images` bucket is created.
6. Navigate to **Project Settings** &rarr; **API** &rarr; copy `Project URL` and `anon public` key into your environment variables.

---

## Vercel Deployment Guide

1. Push your repository to GitHub or GitLab.
2. In the Vercel Dashboard, click **New Project** and import the repository.
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-public-key`
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-public-key`
4. Click **Deploy**. Vercel will build and distribute the app globally.

---

## Project Structure

```
├── .env.example                       # Template for environment variables
├── index.html                         # Entry HTML with synced SEO metadata
├── metadata.json                      # Application metadata
├── package.json                       # Dependencies and build scripts
├── public/
│   ├── robots.txt                     # Search crawler directives
│   └── sitemap.xml                    # Canonical sitemap of published posts
├── src/
│   ├── components/
│   │   ├── blog/
│   │   │   ├── BlogCard.tsx           # Article card with reading time & tags
│   │   │   └── MarkdownRenderer.tsx   # React Markdown with code copy
│   │   ├── comments/
│   │   │   └── CommentsSection.tsx    # Comment list, submission & moderation
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             # Header with theme toggle & role switch
│   │   │   └── Footer.tsx             # Footer with architecture tags
│   │   └── ui/
│   │       ├── Modal.tsx              # Reusable accessible modal
│   │       ├── ConfirmDialog.tsx      # Deletion confirmation dialog
│   │       └── SupabaseConfigModal.tsx# Database settings & status modal
│   ├── context/
│   │   ├── AuthContext.tsx            # Supabase session & user profile state
│   │   ├── ThemeContext.tsx           # Light/Dark/System theme provider
│   │   └── ToastContext.tsx           # Notification toasts
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client & local database store
│   │   └── utils.ts                   # Slugs, reading time, date formatting
│   ├── pages/
│   │   ├── HomePage.tsx               # Landing page with hero & featured posts
│   │   ├── BlogListPage.tsx           # Article directory with filters & search
│   │   ├── BlogPostPage.tsx           # Full article view & comments
│   │   ├── LoginPage.tsx              # Authentication login
│   │   ├── SignUpPage.tsx             # New user registration
│   │   ├── WriterDashboardPage.tsx    # Metrics & author management
│   │   ├── MyPostsPage.tsx            # Tabbed draft/published filter
│   │   ├── PostEditorPage.tsx         # Split live markdown editor & image upload
│   │   ├── ProfilePage.tsx            # User profile and avatar management
│   │   ├── AdminDashboardPage.tsx     # Admin controls for all content
│   │   ├── CommentManagementPage.tsx  # Comment moderation table
│   │   ├── SearchResultsPage.tsx      # Dedicated keyword search
│   │   ├── TagsPage.tsx               # Topic directory
│   │   ├── AboutPage.tsx              # Platform architecture
│   │   └── NotFoundPage.tsx           # 404 error page
│   ├── services/
│   │   ├── postsService.ts            # CRUD operations & RLS enforcement
│   │   ├── commentsService.ts         # Comment queries & moderation
│   │   ├── profilesService.ts         # User profiles & escalation guard
│   │   └── storageService.ts          # Supabase storage image upload
│   ├── types/
│   │   └── blog.ts                    # TypeScript types
│   ├── App.tsx                        # Client-side router & layout
│   ├── main.tsx                       # React DOM root
│   └── index.css                      # Tailwind CSS v4 directives
└── supabase/
    ├── schema.sql                     # Full PostgreSQL setup script
    └── migrations/
        └── 20261004000000_cloudblog_schema.sql # Versioned migration
```

---

## Future Enhancements

- AI article summarization and key takeaway generation
- AI writing assistant (grammar suggestions & outline generation)
- Newsletter subscription integration
- Post likes and bookmarking functionality
- Advanced reader analytics and view count telemetry
- Social sharing previews with dynamic OpenGraph image generation
- Collaborative real-time editing with WebSockets
- Full-text search using PostgreSQL `tsvector` and `tsquery`

---

## Verification & Testing Checklist

- [x] **Sign Up**: Creates user with default `writer` role and auto-generates profile.
- [x] **Login / Logout**: Manages session state and persists session.
- [x] **Protected Routes**: Redirects unauthenticated users to `/login`.
- [x] **Post Creation**: Generates clean slug from title, validates fields, supports live split Markdown.
- [x] **Draft vs Published**: Drafts are visible only to author and admin; public gets only published.
- [x] **Image Upload**: Validates MIME type and size, uploads to `blog-images` bucket.
- [x] **Post Editing & Deletion**: Non-admins can only modify their own posts; admin can modify any post. Cascade deletes comments.
- [x] **Comments**: Authenticated users can comment, edit their own comments, and admins can moderate/delete any comment.
- [x] **Search & Tags**: Real-time filtering across titles, excerpts, tags, and content.
- [x] **Dark Mode**: Persists preference across light, dark, and system modes.
- [x] **SEO**: Dynamic title/meta descriptions, sitemap.xml, robots.txt.
