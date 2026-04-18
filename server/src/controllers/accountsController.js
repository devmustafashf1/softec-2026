import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/env.js';

const STATUS_CYCLE = ['CURRENT', 'PENDING', 'OVERDUE', 'PAID'];
const VALID_STATUSES = new Set(STATUS_CYCLE);

// Parse "1 Week", "1 Month", "6 Months", "Every 3 weeks" → number of days
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

// Given last_payment_date + interval, compute timing context:
// returns { daysOverdue, daysUntilDue, nextDueDate }
function calcTiming(lastPaymentDate, intervalStr) {
  if (!lastPaymentDate) return { daysOverdue: 0, daysUntilDue: null, nextDueDate: null };

  const intervalDays = intervalToDays(intervalStr);
  const nextDue      = new Date(new Date(lastPaymentDate).getTime() + intervalDays * 86400000);
  const diffDays     = Math.floor((nextDue.getTime() - Date.now()) / 86400000);

  return {
    daysOverdue:  diffDays < 0  ? Math.abs(diffDays) : 0,
    daysUntilDue: diffDays >= 0 ? diffDays            : 0,
    nextDueDate:  nextDue,
  };
}

// Build a rich, status-aware prompt for DeepSeek
function buildPrompt(profile, timing) {
  const { daysOverdue, daysUntilDue } = timing;
  const status   = profile.account_status || 'CURRENT';
  const name     = profile.full_name || 'Client';
  const company  = profile.company_name ? ` from ${profile.company_name}` : '';
  const amount   = profile.total_balance
    ? `$${Number(profile.total_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : 'the outstanding amount';
  const interval = profile.next_review || 'regular schedule';

  let situationBlock = '';
  let toneInstruction = '';

  switch (status) {
    case 'PAID':
      situationBlock    = `The client has paid their latest installment of ${amount}. Account is now settled and in good standing.`;
      toneInstruction   = 'Write a warm, appreciative thank-you message. Acknowledge the payment, express gratitude, and mention when the next payment cycle will be (schedule: ${interval}). Keep it brief and positive.';
      break;

    case 'OVERDUE':
      if (daysOverdue > 0) {
        situationBlock  = `The payment of ${amount} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. No payment has been received since the due date.`;
      } else {
        situationBlock  = `The account has been marked as overdue. Payment of ${amount} has not been received.`;
      }
      toneInstruction   = `Write a firm but professional collection message. Clearly state the overdue amount and how many days late it is. Emphasize that immediate action is required. Avoid being aggressive but be direct about consequences if payment is not received.`;
      break;

    case 'PENDING':
      if (daysUntilDue !== null && daysUntilDue <= 7) {
        situationBlock  = `The payment of ${amount} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. Payment schedule: ${interval}.`;
        toneInstruction = `Write a polite but clear reminder. Mention the exact number of days remaining and the amount due. Encourage timely payment to avoid overdue status.`;
      } else if (daysUntilDue !== null) {
        situationBlock  = `The payment of ${amount} is coming up in ${daysUntilDue} days. Payment schedule: ${interval}.`;
        toneInstruction = `Write a friendly heads-up message reminding the client about the upcoming payment. Keep it light and helpful.`;
      } else {
        situationBlock  = `Payment of ${amount} is pending. Payment schedule: ${interval}.`;
        toneInstruction = `Write a polite reminder to prepare for the upcoming payment.`;
      }
      break;

    case 'CURRENT':
    default:
      situationBlock    = `The account is in good standing. Payment of ${amount} is being made on schedule (${interval}).${daysUntilDue !== null ? ` Next payment due in ${daysUntilDue} days.` : ''}`;
      toneInstruction   = `Write a friendly, relationship-building follow-up. Acknowledge their good payment record, provide a brief status update, and encourage them to reach out with any questions.`;
      break;
  }

  return `You are a professional account manager drafting a follow-up message for a client.

CONTEXT:
- Client: ${name}${company}
- Account Status: ${status}
- ${situationBlock}

INSTRUCTIONS:
${toneInstruction}

Write ONLY the message body (3–5 sentences). No subject line, no greeting header, no sign-off.`;
}

// ── PATCH /api/accounts/:id/status ───────────────────────────
export async function changeAccountStatus(req, res) {
  const { id }           = req.params;
  const { account_status } = req.body;

  if (!VALID_STATUSES.has(account_status)) {
    return res.status(400).json({ error: `Status must be one of: ${STATUS_CYCLE.join(', ')}.` });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ account_status })
    .eq('id', id)
    .eq('role', 'client')
    .select('id, account_status')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Account not found.' });

  return res.status(200).json({ account_status: data.account_status });
}

// ── POST /api/accounts/:id/generate-message ──────────────────
export async function generateMessage(req, res) {
  const { id } = req.params;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('full_name, company_name, total_balance, next_review, account_status, last_payment_date')
    .eq('id', id)
    .eq('role', 'client')
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const timing = calcTiming(profile.last_payment_date, profile.next_review);
  const prompt  = buildPrompt(profile, timing);

  try {
    const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${config.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model:       'deepseek-chat',
        max_tokens:  350,
        temperature: 0.7,
        messages:    [{ role: 'user', content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      return res.status(500).json({ error: `DeepSeek error ${aiRes.status}: ${errBody}` });
    }

    const aiResponse = await aiRes.json();
    const content = aiResponse.choices?.[0]?.message?.content?.trim();
    if (!content) return res.status(500).json({ error: 'AI returned an empty response.' });

    const { data: stored, error: storeError } = await supabaseAdmin
      .from('account_messages')
      .insert({
        profile_id:     id,
        content,
        status_at_time: profile.account_status || 'CURRENT',
        days_late:      timing.daysOverdue,
      })
      .select()
      .single();

    if (storeError) return res.status(500).json({ error: storeError.message });

    return res.status(201).json({ message: stored });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'AI generation failed.' });
  }
}

// ── GET /api/accounts/:id/messages ───────────────────────────
export async function getMessages(req, res) {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('account_messages')
    .select('id, content, status_at_time, days_late, created_at, is_sent')
    .eq('profile_id', id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ messages: data || [] });
}

// ── DELETE /api/accounts/:id/messages/:messageId ─────────────
export async function deleteMessage(req, res) {
  const { messageId } = req.params;

  const { error } = await supabaseAdmin
    .from('account_messages')
    .delete()
    .eq('id', messageId);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
}

// ── PATCH /api/accounts/:id/messages/:messageId/send ─────────
export async function sendMessage(req, res) {
  const { messageId } = req.params;

  const { data, error } = await supabaseAdmin
    .from('account_messages')
    .update({ is_sent: true, sent_at: new Date().toISOString() })
    .eq('id', messageId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data)  return res.status(404).json({ error: 'Message not found.' });

  return res.status(200).json({ message: data });
}

// ── GET /api/client/followups ─────────────────────────────────
export async function getClientFollowups(req, res) {
  const clientId = req.user.id;

  const [profileResult, messagesResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('full_name, total_balance, amount_paid, next_review, account_status')
      .eq('id', clientId)
      .single(),
    supabaseAdmin
      .from('account_messages')
      .select('id, content, status_at_time, days_late, sent_at, created_at, is_seen')
      .eq('profile_id', clientId)
      .eq('is_sent', true)
      .order('sent_at', { ascending: false }),
  ]);

  if (profileResult.error)  return res.status(500).json({ error: profileResult.error.message });
  if (messagesResult.error) return res.status(500).json({ error: messagesResult.error.message });

  const followups    = messagesResult.data || [];
  const unseen_count = followups.filter((m) => !m.is_seen).length;

  return res.status(200).json({
    account:   profileResult.data,
    followups,
    unseen_count,
  });
}

// ── PATCH /api/client/followups/seen ─────────────────────────
export async function markFollowupsSeen(req, res) {
  const clientId = req.user.id;

  const { error } = await supabaseAdmin
    .from('account_messages')
    .update({ is_seen: true })
    .eq('profile_id', clientId)
    .eq('is_sent', true)
    .eq('is_seen', false);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
}
