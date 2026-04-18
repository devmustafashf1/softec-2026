import { supabaseAdmin } from '../config/supabase.js';

// ── POST /api/auth/register ──────────────────────────────────
export async function register(req, res) {
  const { email, password, fullName, companyName, industry } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'email, password, and fullName are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Create user in Supabase Auth + pass metadata so the trigger
  // can populate the profiles row automatically.
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,       // skip email-verification for now (admin portal)
    user_metadata: {
      full_name:    fullName,
      company_name: companyName ?? null,
      industry:     industry    ?? null,
      role:         'agent',    // default role; admins can promote later
    },
  });

  if (error) {
    // Supabase returns "User already registered" for duplicate emails
    if (error.message?.toLowerCase().includes('already')) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    return res.status(400).json({ error: error.message });
  }

  return res.status(201).json({
    message: 'Account created successfully',
    user: {
      id:    data.user.id,
      email: data.user.email,
    },
  });
}

// ── POST /api/auth/login ─────────────────────────────────────
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  // signInWithPassword returns an access_token (JWT) + refresh_token
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Don't reveal whether email or password was wrong
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Fetch the profile so we can return role info
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, full_name, company_name, industry, is_active')
    .eq('id', data.user.id)
    .single();

  if (profile && !profile.is_active) {
    return res.status(403).json({ error: 'Account is deactivated. Contact an administrator.' });
  }

  return res.status(200).json({
    token:         data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at:    data.session.expires_at,
    user: {
      id:           data.user.id,
      email:        data.user.email,
      role:         profile?.role         ?? 'agent',
      full_name:    profile?.full_name    ?? null,
      company_name: profile?.company_name ?? null,
      industry:     profile?.industry     ?? null,
    },
  });
}

// ── POST /api/auth/logout ────────────────────────────────────
// The client should discard its token locally. This endpoint
// signs out the session server-side so the JWT is invalidated.
export async function logout(req, res) {
  const header = req.headers.authorization;
  const token  = header?.split(' ')[1];

  if (token) {
    // Sign out the specific session associated with this token
    await supabaseAdmin.auth.admin.signOut(token);
  }

  return res.status(200).json({ message: 'Logged out successfully' });
}

// ── GET /api/auth/me  (protected) ────────────────────────────
// Returns the currently authenticated user's profile.
// Requires the requireAuth middleware to be applied to the route.
export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}

// ── POST /api/auth/refresh ────────────────────────────────────
// Exchanges a refresh_token for a new access_token.
export async function refresh(req, res) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token is required' });
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  return res.status(200).json({
    token:         data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at:    data.session.expires_at,
  });
}
