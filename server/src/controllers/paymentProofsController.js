import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── POST /api/client/payment-proof ───────────────────────────
export async function submitPaymentProof(req, res) {
  const profileId      = req.user.id;
  const { referenceNumber, note } = req.body;
  const file           = req.file;

  console.log('[submitPaymentProof] profileId:', profileId, '| ref:', referenceNumber, '| file:', file ? `${file.originalname} (${file.size} bytes, ${file.mimetype})` : 'MISSING');

  if (!file)            return res.status(400).json({ error: 'Receipt image is required.' });
  if (!referenceNumber) return res.status(400).json({ error: 'Reference number is required.' });

  const ext      = file.mimetype.split('/')[1]?.split('+')[0] || 'jpg';
  const filePath = `${profileId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('payment-proofs')
    .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (uploadError) {
    console.error('[storage upload]', uploadError.message);
    return res.status(500).json({ error: `Storage error: ${uploadError.message}` });
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('payment-proofs')
    .getPublicUrl(filePath);

  const { data, error } = await supabaseAdmin
    .from('payment_proofs')
    .insert({ profile_id: profileId, image_url: publicUrl, reference_number: referenceNumber, note: note || null })
    .select()
    .single();

  if (error) {
    console.error('[db insert]', error.message);
    return res.status(500).json({ error: `Database error: ${error.message}` });
  }

  return res.status(201).json({ proof: data });
}

// ── GET /api/accounts/payment-proofs (all, admin) ────────────
export async function getAllPaymentProofs(req, res) {
  const { data, error } = await supabaseAdmin
    .from('payment_proofs')
    .select('id, image_url, reference_number, note, status, created_at, profile_id, profiles(full_name, username)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ proofs: data || [] });
}

// ── GET /api/accounts/:id/payment-proofs ─────────────────────
export async function getPaymentProofs(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('payment_proofs')
    .select('id, image_url, reference_number, note, status, created_at')
    .eq('profile_id', id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ proofs: data || [] });
}

// ── PATCH /api/accounts/:id/payment-proofs/:proofId ──────────
export async function updateProofStatus(req, res) {
  const { proofId }  = req.params;
  const { status }   = req.body;
  const VALID = new Set(['PENDING', 'VERIFIED', 'REJECTED']);

  if (!VALID.has(status)) {
    return res.status(400).json({ error: 'status must be PENDING, VERIFIED, or REJECTED.' });
  }

  const { data, error } = await supabaseAdmin
    .from('payment_proofs')
    .update({ status })
    .eq('id', proofId)
    .select('id, status')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Proof not found.' });

  return res.status(200).json({ proof: data });
}
