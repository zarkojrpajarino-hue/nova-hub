// Supabase configuration with fallback values for Lovable Cloud
// These are the project's public values (anon key is safe to expose)

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://tqvzdgysxjrjtwvkhkli.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdnpkZ3lzeGpyanR3dmtoa2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NTIzMjMsImV4cCI6MjA4NDUyODMyM30.NMKF5-1yDNlOEZtsB4FSZnwW46hpfdcn4nTM-_tCwew";
export const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "tqvzdgysxjrjtwvkhkli";
