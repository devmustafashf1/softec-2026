import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Admin client — bypasses RLS, use for server-side operations
// persistSession: false prevents signInWithPassword from overwriting the
// service-role JWT, which would cause subsequent DB calls to run under the
// user's identity (and hit RLS) instead of the service role.
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);

// Public client — respects RLS, use when acting on behalf of a user
export const supabase = createClient(
  config.supabaseUrl,
  config.supabasePublishableKey
);
