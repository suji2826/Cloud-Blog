import { supabase } from '../lib/supabase';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  url: string;
  path: string;
}

export const storageService = {
  validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.',
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit. Please upload a smaller image.',
      };
    }

    return { valid: true };
  },

  async uploadImage(
    file: File,
    userId: string,
    postId: string = 'general',
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (onProgress) onProgress(20);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const storagePath = `${userId}/${postId}/${cleanFileName}`;

    if (onProgress) onProgress(50);
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    if (onProgress) onProgress(90);
    const { data: publicUrlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(data.path);

    if (onProgress) onProgress(100);
    return {
      url: publicUrlData.publicUrl,
      path: data.path,
    };
  },
};
