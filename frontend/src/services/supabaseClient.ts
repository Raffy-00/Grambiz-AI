import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://kqmzjuoreadxdtwkjuak.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbXpqdW9yZWFkeGR0d2tqdWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMjI4NDUsImV4cCI6MjEwNTc5ODg0NX0.E1P4_BzyGTiPb1PQHgO_67QTtHza8AE7gs7jFYRcISY';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
