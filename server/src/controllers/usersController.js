import { supabaseAdmin } from '../config/supabase.js';

// ── GET /api/users ────────────────────────────────────────────
// Returns all client-role users with their profile + account data
export async function listUsers(req, res) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, username, email, company_name, total_balance, amount_paid, next_review, account_status, is_active, created_at')
    .eq('role', 'client')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ users: data });
}

// ── POST /api/users ───────────────────────────────────────────
// Admin creates a client user. Clients log in via username, not email.
export async function createUser(req, res) {
  const { fullName, username, password, email, companyName, totalBalance, amountPaid, nextReview, accountStatus } = req.body;

  if (!fullName || !username || !password) {
    return res.status(400).json({ error: 'fullName, username, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check username is unique
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  // Create Supabase Auth user — internal email derived from username
  const internalEmail = `${username.toLowerCase()}@client.sovereign.local`;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: internalEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name:    fullName,
      company_name: companyName ?? null,
      role:         'client',
      username:     username.toLowerCase(),
    },
  });

  if (authError) {
    if (authError.message?.toLowerCase().includes('already')) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    return res.status(400).json({ error: authError.message });
  }

  // Upsert the profile with all client-specific fields
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id:             authData.user.id,
      full_name:      fullName,
      username:       username.toLowerCase(),
      email:          email ?? null,
      company_name:   companyName ?? null,
      role:           'client',
      is_active:      true,
      total_balance:  totalBalance  ?? 0,
      amount_paid:    amountPaid    ?? 0,
      next_review:    nextReview    ?? null,
      account_status: accountStatus ?? 'CURRENT',
    });

  if (profileError) {
    // Roll back auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return res.status(500).json({ error: profileError.message });
  }

  return res.status(201).json({
    message: 'Client user created successfully',
    user: {
      id:       authData.user.id,
      username: username.toLowerCase(),
      fullName,
    },
  });
}

// ── PATCH /api/users/:id/payment ─────────────────────────────
// Update a client's total_balance (payment amount)
export async function updateUserPayment(req, res) {
  const { id } = req.params;
  const { total_balance } = req.body;

  const amount = parseFloat(total_balance);
  if (isNaN(amount) || amount < 0) {
    return res.status(400).json({ error: 'total_balance must be a non-negative number' });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ total_balance: amount })
    .eq('id', id)
    .eq('role', 'client')
    .select('id, total_balance')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'User not found' });

  return res.status(200).json({ total_balance: data.total_balance });
}

// ── DELETE /api/users/:id ─────────────────────────────────────
// Permanently delete a client user from auth + profiles
export async function deleteUser(req, res) {
  const { id } = req.params;

  // Verify it's a client before deleting
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', id)
    .eq('role', 'client')
    .single();

  if (!profile) {
    return res.status(404).json({ error: 'Client user not found' });
  }

  // Delete auth user — cascades to profiles via DB trigger
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  return res.status(200).json({ message: 'User deleted successfully' });
}

// ── PATCH /api/users/:id/status ───────────────────────────────
// Toggle a client user's active/inactive state
export async function toggleUserStatus(req, res) {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active (boolean) is required' });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active })
    .eq('id', id)
    .eq('role', 'client');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: `User ${is_active ? 'activated' : 'deactivated'}` });
}
