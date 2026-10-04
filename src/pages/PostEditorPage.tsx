import React, { useState, useEffect, useRef } from 'react';
import { Post } from '../types/blog';
import { postsService } from '../services/postsService';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { generateSlug, calculateReadingTime } from '../lib/utils';
import { MarkdownRenderer } from '../components/blog/MarkdownRenderer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import {
  ArrowLeft,
  Save,
  Globe,
  UploadCloud,
  X,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Code,
  Quote,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Eye,
  Columns2,
  Maximize2,
} from 'lucide-react';

interface PostEditorPageProps {
  postId?: string; // If present, edit mode; else create mode
  onNavigate: (path: string) => void;
}

export const PostEditorPage: React.FC<PostEditorPageProps> = ({ postId, onNavigate }) => {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const isEditMode = Boolean(postId);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugModified, setSlugModified] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [tags, setTags] = useState<string[]>(['Cloud']);
  const [tagInput, setTagInput] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Editor layout: split or preview toggle on mobile
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing post if in edit mode
  useEffect(() => {
    if (!postId || !user) return;

    const loadPost = async () => {
      try {
        setIsLoading(true);
        const data = await postsService.getPostById(postId, { id: user.id, role });
        if (!data) {
          toast('Post not found or unauthorized.', 'error');
          onNavigate('/dashboard');
          return;
        }

        setTitle(data.title);
        setSlug(data.slug);
        setSlugModified(true);
        setExcerpt(data.excerpt || '');
        setMarkdown(data.markdown);
        setTags(data.tags || []);
        setFeaturedImage(data.featured_image || '');
        setIsPublished(data.published);
      } catch (e: any) {
        toast(e.message || 'Error loading post.', 'error');
        onNavigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
  }, [postId, user, role]);

  // Handle Title Change & auto-slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slugModified) {
      setSlug(generateSlug(newTitle));
    }
  };

  // Add Tag
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Image Upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploadProgress(10);
      const res = await storageService.uploadImage(
        file,
        user.id,
        postId || 'new',
        (p) => setUploadProgress(p)
      );
      setFeaturedImage(res.url);
      toast('Featured image uploaded to Supabase Storage!', 'success');
    } catch (err: any) {
      toast(err.message || 'Image upload failed.', 'error');
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Markdown Toolbar actions
  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end) || defaultPlaceholder;

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent =
      markdown.substring(0, start) + replacement + markdown.substring(end);

    setMarkdown(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  };

  // Save Post (as Draft or Published)
  const handleSave = async (publishStatus: boolean) => {
    if (!user) return;
    if (!title.trim()) {
      toast('Please enter a title for your article.', 'error');
      return;
    }
    if (!markdown.trim()) {
      toast('Please write some content in the markdown editor.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const postData = {
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        excerpt: excerpt.trim() || undefined,
        markdown: markdown.trim(),
        tags,
        featured_image: featuredImage || undefined,
        published: publishStatus,
      };

      if (isEditMode && postId) {
        await postsService.updatePost(postId, postData, { id: user.id, role });
        toast(publishStatus ? 'Post published!' : 'Draft saved successfully.', 'success');
      } else {
        await postsService.createPost(postData, user.id);
        toast(publishStatus ? 'Post published!' : 'Draft saved successfully.', 'success');
      }

      onNavigate('/dashboard');
    } catch (e: any) {
      toast(e.message || 'Failed to save post.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postId || !user) return;
    try {
      await postsService.deletePost(postId, { id: user.id, role });
      toast('Post permanently deleted.', 'success');
      onNavigate('/dashboard');
    } catch (e: any) {
      toast(e.message || 'Failed to delete post.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-stone-500">
        Loading post editor...
      </div>
    );
  }

  const readingTime = calculateReadingTime(markdown);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/dashboard')}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
              {isEditMode ? 'Edit Article' : 'Write New Article'}
            </h1>
            <span className="text-xs text-stone-400">
              Estimated reading time: {readingTime}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {isEditMode && (
            <button
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              className="p-2.5 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Delete article"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Globe className="w-3.5 h-3.5" />
            {isPublished ? 'Update & Publish' : 'Publish Article'}
          </button>
        </div>
      </div>

      {/* Post Metadata Inputs */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Post Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="e.g. Architecting Scalable Cloud Microservices with PostgreSQL"
            className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Slug URL
          </label>
          <div className="flex items-center">
            <span className="px-3 py-2.5 text-xs text-stone-400 bg-stone-50 dark:bg-stone-800/80 border border-r-0 border-stone-200 dark:border-stone-700 rounded-l-xl font-mono">
              /blog/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(generateSlug(e.target.value));
                setSlugModified(true);
              }}
              placeholder="post-slug-url"
              className="flex-1 px-3 py-2.5 text-xs font-mono rounded-r-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Excerpt / Summary
          </label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="A short compelling overview for social previews and search listings..."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Tags (Press Enter to add)
          </label>
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={tags.length === 0 ? 'Type tag and hit Enter...' : '+ add tag'}
              className="flex-1 min-w-[120px] px-2 py-1 text-xs bg-transparent text-stone-900 dark:text-white focus:outline-hidden"
            />
          </div>
        </div>

        {/* Featured Image Upload with Supabase Storage */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Featured Image (Supabase Storage: <code className="font-mono text-indigo-600">blog-images</code>)
          </label>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-indigo-500" />
              Upload Image (JPG, PNG, WEBP &lt; 5MB)
            </button>

            <div className="flex-1 w-full flex items-center gap-2">
              <span className="text-xs text-stone-400">or URL:</span>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-hidden"
              />
              {featuredImage && (
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="p-1.5 text-stone-400 hover:text-rose-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploadProgress !== null && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-indigo-600 dark:text-indigo-400">
                <span>Uploading image to Supabase Storage bucket...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Image Preview */}
          {featuredImage && (
            <div className="mt-3 relative w-full sm:w-80 h-44 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
              <img
                src={featuredImage}
                alt="Featured preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setFeaturedImage('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Markdown Split Editor Container */}
      <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between p-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850 gap-2">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**', 'bold text')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*', 'italic text')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />
            <button
              type="button"
              onClick={() => insertFormatting('# ', '', 'Heading 1')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('## ', '', 'Heading 2')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />
            <button
              type="button"
              onClick={() => insertFormatting('```typescript\n', '\n```', '// Code block here')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Code block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('> ', '', 'Quoted text')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Blockquote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ', '', 'List item')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Unordered list"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('1. ', '', 'Numbered item')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Numbered list"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('[', '](https://example.com)', 'link label')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Link"
            >
              <Link className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('![', '](https://images.unsplash.com/photo-1544383835-bda2bc66a55d)', 'Image Alt')}
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Embed image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-800 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`hidden md:block px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'split'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              Live Preview
            </button>
          </div>
        </div>

        {/* Editor Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200 dark:divide-stone-800 min-h-[500px]">
          {/* Left: Markdown Input */}
          {(activeTab === 'editor' || activeTab === 'split') && (
            <div className={`p-4 flex flex-col ${activeTab === 'editor' ? 'md:col-span-2' : ''}`}>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                Markdown Source
              </div>
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your article in GitHub-flavored Markdown...&#10;&#10;## Introduction&#10;&#10;Share your insights with code blocks, quotes, and images."
                className="w-full flex-1 min-h-[420px] p-2 text-sm font-mono text-stone-900 dark:text-stone-100 bg-transparent focus:outline-hidden resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Right: Live Preview */}
          {(activeTab === 'preview' || activeTab === 'split') && (
            <div className={`p-6 overflow-y-auto max-h-[700px] ${activeTab === 'preview' ? 'md:col-span-2' : ''}`}>
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-3 pb-1 border-b border-stone-100 dark:border-stone-800">
                Live Markdown Preview
              </div>
              {markdown.trim() ? (
                <MarkdownRenderer content={markdown} />
              ) : (
                <div className="text-center py-20 text-stone-400 text-sm italic">
                  Markdown preview will render here as you type.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to permanently delete this post?"
        confirmText="Delete Post"
      />
    </div>
  );
};
