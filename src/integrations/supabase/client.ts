// Safe Supabase client with fallback configuration
// This ensures the app works even if env vars are not properly injected
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Create client with fallback values
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Re-export for backwards compatibility
export default supabase;
