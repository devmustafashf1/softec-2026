import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/env.js';

// ── Timing helpers (same as accountsController) ───────────────
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

function calcTiming(lastPaymentDate, intervalStr) {
  if (!lastPaymentDate) return { daysOverdue: 0, daysUntilDue: null };
  const intervalDays = intervalToDays(intervalStr);
  const nextDue = new Date(new Date(lastPaymentDate).getTime() + intervalDays * 86400000);
  const diffDays = Math.floor((nextDue.getTime() - Date.now()) / 86400000);
  return {
    daysOverdue:  diffDays < 0  ? Math.abs(diffDays) : 0,
    daysUntilDue: diffDays >= 0 ? diffDays            : 0,
  };
}

function buildFollowupPrompt(profile, timing) {
  const { daysOverdue, daysUntilDue } = timing;
  const status   = profile.account_status || 'CURRENT';
  const name     = profile.full_name || 'Client';
  const company  = profile.company_name ? ` from ${profile.company_name}` : '';
  const amount   = profile.total_balance
    ? `$${Number(profile.total_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    : 'the outstanding amount';
  const interval = profile.next_review || 'regular schedule';

  const situations = {
    OVERDUE:  { ctx: `Payment of ${amount} is ${daysOverdue} day(s) overdue. No payment received since the due date.`,
                tone: 'Firm but professional. State the overdue amount and days late clearly. Emphasize immediate action needed.' },
    PENDING:  { ctx: `Payment of ${amount} due in ${daysUntilDue} day(s). Schedule: ${interval}.`,
                tone: 'Polite but clear reminder. Mention exact days and amount.' },
    CURRENT:  { ctx: `Account in good standing. Payment of ${amount} on schedule (${interval}).`,
                tone: 'Friendly relationship-building message. Acknowledge good record.' },
    PAID:     { ctx: `Latest installment of ${amount} has been received. Account settled.`,
                tone: 'Warm thank-you. Express gratitude, mention next payment cycle.' },
  };

  const { ctx, tone } = situations[status] || situations.CURRENT;

  return `You are a professional account manager drafting a follow-up message.
Client: ${name}${company} | Status: ${status}
Situation: ${ctx}
Instructions: ${tone}
Write ONLY the message body (3-5 sentences). No subject line, greeting header, or sign-off.`;
}

// ── Tool: generate + send a follow-up for one or more clients ─
async function executeSendFollowup({ clients }) {
  const results = [];

  for (const { id, name } of clients) {
    try {
      // 1. Fetch profile
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('full_name, company_name, total_balance, next_review, account_status, last_payment_date')
        .eq('id', id)
        .eq('role', 'client')
        .single();

      if (error || !profile) {
        results.push({ name, success: false, error: 'Client not found in database' });
        continue;
      }

      // 2. Generate message
      const timing  = calcTiming(profile.last_payment_date, profile.next_review);
      const prompt  = buildFollowupPrompt(profile, timing);

      const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.deepseekApiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat', max_tokens: 300, temperature: 0.7,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!aiRes.ok) throw new Error(`AI generation failed (${aiRes.status})`);

      const aiData  = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('AI returned empty message');

      // 3. Store in account_messages
      const { data: stored, error: storeErr } = await supabaseAdmin
        .from('account_messages')
        .insert({
          profile_id:     id,
          content,
          status_at_time: profile.account_status || 'CURRENT',
          days_late:      timing.daysOverdue,
        })
        .select()
        .single();

      if (storeErr) throw new Error(storeErr.message);

      // 4. Mark as sent
      const { error: sendErr } = await supabaseAdmin
        .from('account_messages')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('id', stored.id);

      if (sendErr) throw new Error(sendErr.message);

      results.push({
        name,
        success: true,
        status: profile.account_status,
        balance: profile.total_balance,
        preview: content.substring(0, 120) + (content.length > 120 ? '...' : ''),
      });
    } catch (err) {
      results.push({ name, success: false, error: err.message });
    }
  }

  return results;
}

// ── DeepSeek tool definitions ─────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'send_followup',
      description: 'Generate and send a follow-up message to one or more clients. Call this when the admin asks to send, deliver, or dispatch a follow-up to specific clients or a group (e.g. all overdue clients).',
      parameters: {
        type: 'object',
        required: ['clients'],
        properties: {
          clients: {
            type: 'array',
            description: 'List of clients to send follow-ups to',
            items: {
              type: 'object',
              required: ['id', 'name'],
              properties: {
                id:   { type: 'string', description: 'The client profile UUID from the client list' },
                name: { type: 'string', description: 'The client full name' },
              },
            },
          },
        },
      },
    },
  },
];

// ── Call DeepSeek ─────────────────────────────────────────────
async function callDeepSeek(messages, useTools = true) {
  const body = {
    model:       'deepseek-chat',
    max_tokens:  700,
    temperature: 0.65,
    messages,
  };
  if (useTools) {
    body.tools      = TOOLS;
    body.tool_choice = 'auto';
  }

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.deepseekApiKey}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`DeepSeek error ${res.status}: ${txt}`);
  }

  return (await res.json()).choices?.[0]?.message;
}

// ── Main chat handler ─────────────────────────────────────────
export async function chat(req, res) {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Load live client data
    const { data: clients, error: clientsError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, company_name, total_balance, amount_paid, account_status, next_review, last_payment_date, email')
      .eq('role', 'client')
      .eq('is_active', true)
      .order('account_status');

    if (clientsError) throw new Error(clientsError.message);

    const { data: recentMessages } = await supabaseAdmin
      .from('account_messages')
      .select('id, content, status_at_time, created_at, is_sent, profile_id')
      .order('created_at', { ascending: false })
      .limit(30);

    const allClients  = clients || [];
    const msgs        = recentMessages || [];
    const fmtUSD      = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    const byStatus = (s) => allClients.filter(c => c.account_status === s);

    const formatClient = (c) => {
      const lastSent = msgs.filter(m => m.profile_id === c.id && m.is_sent)[0];
      const msgInfo  = lastSent
        ? `Last follow-up (${new Date(lastSent.created_at).toLocaleDateString()}): "${lastSent.content.substring(0, 80)}..."`
        : 'No follow-ups sent yet';
      return `  • [ID:${c.id}] ${c.full_name}${c.company_name ? ` (${c.company_name})` : ''} | Balance: ${fmtUSD(c.total_balance)} | Paid: ${fmtUSD(c.amount_paid)} | Schedule: ${c.next_review || 'N/A'} | ${msgInfo}`;
    };

    const overdueList  = byStatus('OVERDUE');
    const pendingList  = byStatus('PENDING');
    const currentList  = byStatus('CURRENT');
    const paidList     = byStatus('PAID');

    const systemPrompt = `You are an AI Collection Assistant for DueAssist, a debt recovery platform. You help the admin manage accounts, track payments, and send follow-up messages to clients.

TODAY: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

=== PORTFOLIO SUMMARY ===
Total Clients   : ${allClients.length}
Total Outstanding: ${fmtUSD(allClients.reduce((s, c) => s + (Number(c.total_balance) || 0), 0))}
Total Collected : ${fmtUSD(allClients.reduce((s, c) => s + (Number(c.amount_paid) || 0), 0))}
Overdue: ${overdueList.length} | Pending: ${pendingList.length} | Current: ${currentList.length} | Paid: ${paidList.length}

=== OVERDUE CLIENTS (need immediate action) ===
${overdueList.length > 0 ? overdueList.map(formatClient).join('\n') : '  None'}

=== PENDING CLIENTS ===
${pendingList.length > 0 ? pendingList.map(formatClient).join('\n') : '  None'}

=== CURRENT CLIENTS ===
${currentList.length > 0 ? currentList.map(formatClient).join('\n') : '  None'}

=== PAID CLIENTS ===
${paidList.length > 0 ? paidList.map(formatClient).join('\n') : '  None'}

=== YOUR CAPABILITIES ===
1. Answer questions about clients using the data above (always use real names and amounts).
2. **Send follow-up messages**: When the admin says "send", "send them a follow-up", "send him/her a message", etc. — call the send_followup tool with the correct client ID(s) from the list above. The [ID:...] shown next to each client name is what you pass.
3. Suggest follow-up message text.
4. Provide portfolio insights.

IMPORTANT: Never make up client IDs — only use the [ID:...] values from the client list above. When sending to a group like "all overdue clients", include ALL clients from that group.`;

    // Build messages array
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    // ── Round 1: may return tool calls ──
    const assistantMsg = await callDeepSeek(chatMessages);

    if (!assistantMsg?.tool_calls?.length) {
      // No tool call — plain text reply
      const reply = assistantMsg?.content?.trim();
      if (!reply) return res.status(500).json({ error: 'AI returned an empty response.' });
      return res.status(200).json({ reply });
    }

    // ── Round 2: execute tool calls ──────────────────────────
    const toolResultMessages = [assistantMsg];

    for (const toolCall of assistantMsg.tool_calls) {
      let result;

      if (toolCall.function.name === 'send_followup') {
        const args = JSON.parse(toolCall.function.arguments);
        result = await executeSendFollowup(args);
      } else {
        result = { error: 'Unknown tool' };
      }

      toolResultMessages.push({
        role:         'tool',
        tool_call_id: toolCall.id,
        content:      JSON.stringify(result),
      });
    }

    // ── Round 3: final AI reply with tool results ─────────────
    const finalMessages = [...chatMessages, ...toolResultMessages];
    const finalMsg      = await callDeepSeek(finalMessages, false);
    const reply         = finalMsg?.content?.trim();

    if (!reply) return res.status(500).json({ error: 'AI returned an empty final response.' });

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Chat failed.' });
  }
}
