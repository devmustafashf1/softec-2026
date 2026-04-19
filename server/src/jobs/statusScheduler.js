import cron from 'node-cron';
import { supabaseAdmin } from '../config/supabase.js';

function intervalToDays(interval) {
  if (!interval) return 30;
  const s = interval.toLowerCase();
  const n = parseInt(s.match(/\d+/)?.[0] || '1', 10);
  if (s.includes('day'))   return n;
  if (s.includes('week'))  return n * 7;
  if (s.includes('month')) return n * 30;
  if (s.includes('year'))  return n * 365;
  return 30;
}

async function runStatusTransitions() {
  const { data: paidProfiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, last_payment_date, next_review')
    .eq('role', 'client')
    .eq('is_active', true)
    .eq('account_status', 'PAID');

  if (error) {
    console.error('[scheduler] fetch error:', error.message);
    return;
  }

  const now = Date.now();
  const toTransition = (paidProfiles || []).filter(p => {
    if (!p.last_payment_date) return false;
    const days    = intervalToDays(p.next_review);
    const nextDue = new Date(p.last_payment_date).getTime() + days * 86400000;
    return now >= nextDue;
  });

  if (!toTransition.length) return;

  const ids = toTransition.map(p => p.id);
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ account_status: 'PENDING' })
    .in('id', ids);

  if (updateError) {
    console.error('[scheduler] update error:', updateError.message);
  } else {
    console.log(`[scheduler] ${ids.length} account(s) transitioned PAID → PENDING`);
  }
}

export function startStatusScheduler() {
  // Run immediately on startup to catch any missed transitions
  runStatusTransitions();

  // Then run every hour
  cron.schedule('0 * * * *', () => {
    console.log('[scheduler] running status transition check');
    runStatusTransitions();
  });

  console.log('[scheduler] status scheduler started');
}
