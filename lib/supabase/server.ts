import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerSupabase() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const allCookies = cookieStore.getAll();
  for (const c of allCookies) {
    if (c.name.includes('auth-token')) {
      try {
        const decoded = decodeURIComponent(c.value);
        const parsed = JSON.parse(decoded);
        if (parsed.access_token) {
          await client.auth.setSession({
            access_token: parsed.access_token,
            refresh_token: parsed.refresh_token || '',
          });
          break;
        }
      } catch {
        if (c.value && c.value.includes('.')) {
          try {
            await client.auth.setSession({
              access_token: c.value,
              refresh_token: '',
            });
          } catch {
            // ignore
          }
        }
      }
    }
  }

  return client;
}

export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
