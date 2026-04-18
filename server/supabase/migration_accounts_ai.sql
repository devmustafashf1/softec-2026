-- ============================================================
--  Migration: account status tracking + AI messages
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Track when the client last made a payment (used to calculate days late / days until due)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_payment_date timestamptz;

-- account_status now supports: CURRENT, PENDING, OVERDUE, PAID
-- (the column is text so no enum migration needed)

-- Store AI-generated follow-up messages per account
CREATE TABLE IF NOT EXISTS public.account_messages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        text        NOT NULL,
  status_at_time text,
  days_late      int         DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS (service role bypasses it automatically)
ALTER TABLE public.account_messages ENABLE ROW LEVEL SECURITY;

-- Admins can read messages for their clients via service role (already bypassed)
-- Add a policy so the admin JWT also works if ever used directly:
CREATE POLICY "admins: read messages"
  ON public.account_messages
  FOR SELECT
  USING (public.get_my_role() = 'admin');
