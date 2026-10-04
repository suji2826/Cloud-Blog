import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Post, Comment, Profile, UserRole, PostFilterOptions } from '../types/blog';

// Check for Supabase configuration in environment or localStorage
const getEnvConfig = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('CLOUDBLOG_SUPABASE_URL') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('CLOUDBLOG_SUPABASE_KEY') : null;

  const url = customUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const key = customKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !url.includes('your-project.supabase.co')
  );

  return { url, key, isConfigured };
};

export const supabaseConfig = getEnvConfig();

export let supabase: SupabaseClient | null = null;
if (supabaseConfig.isConfigured) {
  try {
    supabase = createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (e) {
    console.warn('Could not initialize Supabase client:', e);
    supabase = null;
  }
}

// -----------------------------------------------------------------------------
// Seed Data for Instant Usability & Offline/Demo Mode
// -----------------------------------------------------------------------------
const SEED_PROFILES: Profile[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    display_name: 'Alex Rivera',
    role: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    bio: 'Lead Cloud Architect & CloudBlog Platform Administrator.',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    display_name: 'Sarah Chen',
    role: 'writer',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    bio: 'Full-stack software engineer writing about Kubernetes, PostgreSQL, and modern React.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    display_name: 'Marcus Vance',
    role: 'reader',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    bio: 'Tech enthusiast and distributed systems enthusiast.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_POSTS: Post[] = [
  {
    id: 'p1111111-1111-4111-a111-111111111111',
    author: '11111111-1111-4111-a111-111111111111',
    title: 'Introduction to Cloud-Native Architecture',
    slug: 'introduction-to-cloud-native-architecture',
    excerpt: 'Explore how containerization, microservices, and serverless architectures unlock modern cloud scale and fault tolerance.',
    tags: ['Cloud', 'DevOps', 'Architecture'],
    featured_image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    published: true,
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    markdown: `## What is Cloud-Native?

Cloud-native architecture is an approach to designing, building, and running applications that exploit the advantages of the cloud computing delivery model. Rather than simply hosting traditional monolithic apps on cloud virtual machines, cloud-native systems are built from the ground up for elasticity and resilience.

### Core Pillars of Cloud-Native

1. **Microservices**: Decomposing monolithic applications into loosely coupled, independently deployable services.
2. **Containerization**: Packaging each unit of software with its exact runtime dependencies using Docker.
3. **Continuous Delivery**: Automating testing and deployment pipelines to deliver updates with zero downtime.
4. **Declarative APIs**: Infrastructure as code (IaC) and orchestration engines like Kubernetes.

> "Cloud-native technologies empower organizations to build and run scalable applications in modern, dynamic environments such as public, private, and hybrid clouds." — CNCF

### Sample Kubernetes Deployment

Here is an example of a declarative deployment specification:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudblog-api
  labels:
    app: cloudblog
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cloudblog
  template:
    metadata:
      labels:
        app: cloudblog
    spec:
      containers:
      - name: api
        image: cloudblog/backend:v1.2.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
\`\`\`

### Why It Matters

Organizations transitioning to cloud-native models experience:
* Faster time to market
* Automatic horizontal scaling based on real-time traffic
* Increased system reliability through self-healing pods
* Optimized infrastructure costs through dynamic resource allocation

Building on top of modern cloud primitives allows engineering teams to focus on customer value instead of managing bare-metal servers.`,
  },
  {
    id: 'p2222222-2222-4222-a222-222222222222',
    author: '22222222-2222-4222-a222-222222222222',
    title: 'Mastering PostgreSQL Row Level Security (RLS)',
    slug: 'mastering-postgresql-row-level-security',
    excerpt: 'A comprehensive guide to protecting sensitive multi-tenant data directly at the database engine level with Supabase and Postgres.',
    tags: ['PostgreSQL', 'Security', 'Database'],
    featured_image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
    published: true,
    published_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    markdown: `## Why Row Level Security Matters

In standard database designs, application developers handle data isolation entirely in their application backend code using WHERE clauses:

\`\`\`sql
-- Vulnerable if developer forgets the user_id condition!
SELECT * FROM posts WHERE id = 'xyz' AND author = current_user_id;
\`\`\`

If a single endpoint forgets to check permissions, user data can leak. **Row Level Security (RLS)** in PostgreSQL solves this by moving authorization into the database kernel itself.

### Enabling RLS in PostgreSQL

First, activate RLS on the target table:

\`\`\`sql
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
\`\`\`

Once enabled, no rows can be selected, inserted, updated, or deleted unless an explicit policy allows it!

### Defining Authorship Policies

Here is how we allow authors to edit their own posts while permitting the public to only read published entries:

\`\`\`sql
-- 1. Anyone can read published posts
CREATE POLICY "Public read published posts"
ON public.posts
FOR SELECT
USING (published = true);

-- 2. Authors can read their own drafts
CREATE POLICY "Authors view own posts"
ON public.posts
FOR SELECT
USING (auth.uid() = author);

-- 3. Authors can update their own posts
CREATE POLICY "Authors update own posts"
ON public.posts
FOR UPDATE
USING (auth.uid() = author)
WITH CHECK (auth.uid() = author);
\`\`\`

### Role-Based Access with Postgres Functions

For administrators, we can create a security definer helper:

\`\`\`sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;
\`\`\`

With RLS in place, you achieve defense-in-depth where unauthorized access is impossible even if an API route has an edge-case bug.`,
  },
  {
    id: 'p3333333-3333-4333-a333-333333333333',
    author: '22222222-2222-4222-a222-222222222222',
    title: 'Building Resilient Microservices with Docker',
    slug: 'building-resilient-microservices-with-docker',
    excerpt: 'Step-by-step techniques to structure containerized microservices, minimize build layers, and safeguard health checks.',
    tags: ['DevOps', 'Programming', 'Cloud'],
    featured_image: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1200&q=80',
    published: true,
    published_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    markdown: `## Modern Microservices Architecture

Containerization has revolutionized how engineering teams package, distribute, and orchestrate scalable applications. By isolating processes in lightweight containers, Docker eliminates "it works on my machine" issues forever.

### Multi-Stage Docker Builds

Multi-stage builds allow you to drastically shrink image sizes by leaving development tooling out of production artifacts:

\`\`\`dockerfile
# Stage 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
\`\`\`

### Essential Health Check Configuration

Always define health checks to ensure Kubernetes or Cloud Run can replace faulty containers:

\`\`\`dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget -qO- http://localhost:3000/api/health || exit 1
\`\`\`

Applying these guidelines creates resilient microservices that spin up quickly and survive production incidents.`,
  },
  {
    id: 'p4444444-4444-4444-a444-444444444444',
    author: '11111111-1111-4111-a111-111111111111',
    title: 'Next-Gen AI Agents in Cloud Pipelines (Draft)',
    slug: 'next-gen-ai-agents-in-cloud-pipelines',
    excerpt: 'An internal draft reviewing how autonomous reasoning agents can optimize CI/CD pipelines and infrastructure deployments.',
    tags: ['AI', 'Cloud'],
    featured_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    published: false,
    published_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    markdown: `## Draft: Autonomous Cloud Operations

*Note: This is an unreleased draft for internal engineering review.*

As cloud deployments become more distributed, automated agents capable of evaluating telemetry and proposing code modifications will become standard.

Key exploration areas:
- Automated canary analysis
- Synthetic canary traffic generation
- Predictive pod autoscaling based on seasonal metrics`,
  },
];

const SEED_COMMENTS: Comment[] = [
  {
    id: 'c1111111-1111-4111-a111-111111111111',
    post_id: 'p1111111-1111-4111-a111-111111111111',
    user_id: '33333333-3333-4333-a333-333333333333',
    body: 'Fantastic breakdown of cloud-native principles! The Kubernetes manifest example is clear and actionable.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'c2222222-2222-4222-a222-222222222222',
    post_id: 'p2222222-2222-4222-a222-222222222222',
    user_id: '11111111-1111-4111-a111-111111111111',
    body: 'RLS is truly a game changer for multi-tenant applications. Excellent explanation of SECURITY DEFINER functions.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// -----------------------------------------------------------------------------
// Local Storage Store Manager (Provides instantaneous persistence and real RLS)
// -----------------------------------------------------------------------------
class LocalStore {
  private profilesKey = 'cloudblog_profiles_v1';
  private postsKey = 'cloudblog_posts_v1';
  private commentsKey = 'cloudblog_comments_v1';
  private authKey = 'cloudblog_auth_user_v1';

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(this.profilesKey)) {
      localStorage.setItem(this.profilesKey, JSON.stringify(SEED_PROFILES));
    }
    if (!localStorage.getItem(this.postsKey)) {
      localStorage.setItem(this.postsKey, JSON.stringify(SEED_POSTS));
    }
    if (!localStorage.getItem(this.commentsKey)) {
      localStorage.setItem(this.commentsKey, JSON.stringify(SEED_COMMENTS));
    }
    // Default current user: Writer (Sarah Chen)
    if (!localStorage.getItem(this.authKey)) {
      const defaultUser = {
        id: SEED_PROFILES[1].id,
        email: 'writer@cloudblog.io',
        profile: SEED_PROFILES[1],
      };
      localStorage.setItem(this.authKey, JSON.stringify(defaultUser));
    }
  }

  // Auth Operations
  getCurrentUser(): { id: string; email: string; profile: Profile } | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(this.authKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Refresh profile in case it was updated
      const profile = this.getProfile(parsed.id) || parsed.profile;
      return { ...parsed, profile };
    } catch {
      return null;
    }
  }

  setCurrentUser(user: { id: string; email: string; profile: Profile } | null) {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(this.authKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.authKey);
    }
  }

  // Profiles Operations
  getProfiles(): Profile[] {
    try {
      const raw = localStorage.getItem(this.profilesKey);
      return raw ? JSON.parse(raw) : SEED_PROFILES;
    } catch {
      return SEED_PROFILES;
    }
  }

  getProfile(id: string): Profile | undefined {
    return this.getProfiles().find((p) => p.id === id);
  }

  saveProfile(profile: Profile): Profile {
    const list = this.getProfiles();
    const idx = list.findIndex((p) => p.id === profile.id);
    const updated = { ...profile, updated_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    localStorage.setItem(this.profilesKey, JSON.stringify(list));

    // Update current auth session if same user
    const cur = this.getCurrentUser();
    if (cur && cur.id === profile.id) {
      this.setCurrentUser({ ...cur, profile: updated });
    }
    return updated;
  }

  // Posts Operations
  getPosts(): Post[] {
    try {
      const raw = localStorage.getItem(this.postsKey);
      return raw ? JSON.parse(raw) : SEED_POSTS;
    } catch {
      return SEED_POSTS;
    }
  }

  savePost(post: Post): Post {
    const list = this.getPosts();
    const idx = list.findIndex((p) => p.id === post.id);
    const updated = { ...post, updated_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    localStorage.setItem(this.postsKey, JSON.stringify(list));
    return updated;
  }

  deletePost(id: string): boolean {
    const list = this.getPosts().filter((p) => p.id !== id);
    localStorage.setItem(this.postsKey, JSON.stringify(list));
    // Cascade delete comments
    const comments = this.getComments().filter((c) => c.post_id !== id);
    localStorage.setItem(this.commentsKey, JSON.stringify(comments));
    return true;
  }

  // Comments Operations
  getComments(): Comment[] {
    try {
      const raw = localStorage.getItem(this.commentsKey);
      return raw ? JSON.parse(raw) : SEED_COMMENTS;
    } catch {
      return SEED_COMMENTS;
    }
  }

  saveComment(comment: Comment): Comment {
    const list = this.getComments();
    const idx = list.findIndex((c) => c.id === comment.id);
    const updated = { ...comment, updated_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    localStorage.setItem(this.commentsKey, JSON.stringify(list));
    return updated;
  }

  deleteComment(id: string): boolean {
    const list = this.getComments().filter((c) => c.id !== id);
    localStorage.setItem(this.commentsKey, JSON.stringify(list));
    return true;
  }

  resetToDefaults() {
    localStorage.setItem(this.profilesKey, JSON.stringify(SEED_PROFILES));
    localStorage.setItem(this.postsKey, JSON.stringify(SEED_POSTS));
    localStorage.setItem(this.commentsKey, JSON.stringify(SEED_COMMENTS));
  }
}

export const localStore = new LocalStore();
