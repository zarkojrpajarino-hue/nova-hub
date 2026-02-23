// Supabase configuration with fallback values
// These are the project's public values (anon key is safe to expose)

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://aguuckggskweobxeosrq.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndXVja2dnc2t3ZW9ieGVvc3JxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODc4NDYsImV4cCI6MjA4NTE2Mzg0Nn0.zf6jn8PHa7uy7CNBJKBeli4H_DgSwFyQboa4NzniZvY";
export const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "aguuckggskweobxeosrq";
