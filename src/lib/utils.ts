/**
 * Generate a clean, URL-safe slug from a post title
 */
export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+|-+$/g, ''); // trim - from ends of text
}

/**
 * Calculate estimated reading time based on standard 200 words per minute
 */
export function calculateReadingTime(markdownText: string): string {
  if (!markdownText) return '1 min read';
  // Strip code blocks and markdown symbols for cleaner word count
  const cleanText = markdownText
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`.*?`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[#*>\-_~]/g, '');

  const words = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(words / 200);
  return minutes <= 1 ? '1 min read' : `${minutes} min read`;
}

/**
 * Format date for blog posts and comments
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Draft';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Recently';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Recently';
  }
}

/**
 * Format relative time (e.g. 5 minutes ago, 2 hours ago)
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return 'Recently';
  }
}
