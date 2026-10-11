import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('CLOUDBLOG_SUPABASE_URL') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('CLOUDBLOG_SUPABASE_KEY') : null;

  const url =
    customUrl ||
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';

  const key =
    customKey ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  const isConfigured = Boolean(
    url &&
    key &&
    url.startsWith('http') &&
    !url.includes('your-project-id') &&
    !url.includes('your-project.supabase.co')
  );

  return { url, key, isConfigured };
};

export const supabaseConfig = getSupabaseConfig();

// Fallback dummy URL so createClient does not crash if env is unpopulated on initial run
const activeUrl = supabaseConfig.url || 'https://placeholder-project.supabase.co';
const activeKey = supabaseConfig.key || 'placeholder-anon-key';

export const supabase: SupabaseClient = createClient(activeUrl, activeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
