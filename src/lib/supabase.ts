import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

const rawUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL);
const initialSupabaseUrl = (rawUrl || 'https://placeholder-supabase.supabase.co')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '');

const initialAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) || 'placeholder-anon-key';

export let isSupabaseConfigured = Boolean(
  rawUrl &&
  initialAnonKey &&
  !rawUrl.includes('placeholder') &&
  initialAnonKey !== 'placeholder-anon-key'
);

export let supabase: SupabaseClient = createClient(initialSupabaseUrl, initialAnonKey);

let configChecked = false;

/**
 * Ensures Supabase client is initialized with active credentials,
 * fetching from the serverless /api/config route if needed and verifying reachability.
 */
export async function ensureSupabaseClient(): Promise<SupabaseClient | null> {
  if (configChecked) {
    return isSupabaseConfigured ? supabase : null;
  }

  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const json = await res.json();
      configChecked = true;
      if (json.success && json.isOnline && json.supabaseUrl && json.supabaseAnonKey) {
        const cleanUrl = cleanEnv(json.supabaseUrl).replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
        const cleanKey = cleanEnv(json.supabaseAnonKey);

        if (cleanUrl && cleanKey && !cleanUrl.includes('placeholder')) {
          supabase = createClient(cleanUrl, cleanKey);
          isSupabaseConfigured = true;
          return supabase;
        }
      } else if (json.success && json.isOnline === false) {
        // Backend confirmed Supabase endpoint is currently offline/unreachable
        isSupabaseConfigured = false;
        return null;
      }
    }
  } catch (err) {
    console.warn('[Supabase] Server config check failed:', err);
  }

  configChecked = true;
  return isSupabaseConfigured ? supabase : null;
}

// Automatically trigger background configuration fetch
if (typeof window !== 'undefined') {
  ensureSupabaseClient().catch(() => {});
}
