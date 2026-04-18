import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

// Admin client — bypasses RLS, use for server-side operations
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey
);

// Public client — respects RLS, use when acting on behalf of a user
export const supabase = createClient(
  config.supabaseUrl,
  config.supabasePublishableKey
);
