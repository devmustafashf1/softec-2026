import { supabaseAdmin } from '../config/supabase.js';

/**
 * Verifies the Bearer JWT from the Authorization header.
 * On success, sets req.user = { id, email, role, full_name, ... }
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.split(' ')[1];

  // Verify the JWT with Supabase — returns the auth user
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Fetch profile to get role and other app-specific fields
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, full_name, company_name, industry, phone, is_active')
    .eq('id', user.id)
    .single();

  if (profile && !profile.is_active) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }

  req.user = {
    id:          user.id,
    email:       user.email,
    role:        profile?.role ?? 'agent',
    full_name:   profile?.full_name ?? null,
    company_name: profile?.company_name ?? null,
    industry:    profile?.industry ?? null,
    phone:       profile?.phone ?? null,
  };

  next();
}

/**
 * Role guard — use after requireAuth.
 * Usage: requireRole('admin')  or  requireRole(['admin', 'agent'])
 */
export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
