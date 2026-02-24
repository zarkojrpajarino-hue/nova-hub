// Supabase configuration with fallback values
// These are the project's public values (anon key is safe to expose)

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zzxngvqwmnouchbulvlo.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eG5ndnF3bW5vdWNoYnVsdmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDkyNDEsImV4cCI6MjA4NzQ4NTI0MX0.u0bzjhkbHrijmuvKecdRsdxYN4qn43g1fhayP7SiOvs";
export const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || "zzxngvqwmnouchbulvlo";
