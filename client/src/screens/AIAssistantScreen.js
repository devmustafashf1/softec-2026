import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { api } from '../services/api';

const INITIAL_MESSAGE = {
  id: 'init',
  role: 'assistant',
  content: "Hello! I'm your DueAssist Collection Assistant.\n\nI have live access to all your client data — balances, statuses, and follow-up history. Ask me anything:\n\n• **Who is overdue?**\n• **Suggest a follow-up for [client name]**\n• **What's the portfolio summary?**\n• **Which clients haven't been contacted yet?**",
  time: new Date(),
};

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'TODAY';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
}

// ── Inline markdown renderer ──────────────────────────────────
// Handles: **bold**, *italic*, `code`, plain text within a line
function InlineText({ text, baseStyle }) {
  // Split by bold (**text**), italic (*text*), code (`text`)
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'plain', text: text.slice(last, match.index) });
    }
    if (match[0].startsWith('**')) {
      parts.push({ type: 'bold', text: match[2] });
    } else if (match[0].startsWith('*')) {
      parts.push({ type: 'italic', text: match[3] });
    } else {
      parts.push({ type: 'code', text: match[4] });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push({ type: 'plain', text: text.slice(last) });
  }

  return (
    <Text style={baseStyle}>
      {parts.map((p, i) => {
        if (p.type === 'bold')   return <Text key={i} style={[baseStyle, mdStyles.bold]}>{p.text}</Text>;
        if (p.type === 'italic') return <Text key={i} style={[baseStyle, mdStyles.italic]}>{p.text}</Text>;
        if (p.type === 'code')   return <Text key={i} style={[baseStyle, mdStyles.code]}>{p.text}</Text>;
        return <Text key={i} style={baseStyle}>{p.text}</Text>;
      })}
    </Text>
  );
}

// Parses the full message into blocks: heading, bullet, numbered, divider, paragraph
function MarkdownBlock({ content, isUser }) {
  const baseText = isUser ? mdStyles.userText : mdStyles.aiText;
  const lines = content.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') {
      blocks.push(<View key={`sp-${i}`} style={mdStyles.spacer} />);
      i++;
      continue;
    }

    // Heading ## or #
    if (/^#{1,3}\s/.test(line)) {
      const text = line.replace(/^#{1,3}\s/, '');
      blocks.push(
        <InlineText key={i} text={text} baseStyle={[baseText, mdStyles.heading]} />
      );
      i++;
      continue;
    }

    // Horizontal divider ---
    if (/^[-—]{3,}$/.test(line.trim())) {
      blocks.push(<View key={i} style={[mdStyles.divider, isUser ? mdStyles.dividerUser : mdStyles.dividerAI]} />);
      i++;
      continue;
    }

    // Bullet: • or - or *
    if (/^[•\-\*]\s/.test(line)) {
      const text = line.replace(/^[•\-\*]\s/, '');
      blocks.push(
        <View key={i} style={mdStyles.bulletRow}>
          <Text style={[baseText, mdStyles.bulletDot]}>•</Text>
          <InlineText text={text} baseStyle={[baseText, mdStyles.bulletText]} />
        </View>
      );
      i++;
      continue;
    }

    // Numbered list: 1. 2. etc.
    const numMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      blocks.push(
        <View key={i} style={mdStyles.bulletRow}>
          <Text style={[baseText, mdStyles.bulletDot]}>{numMatch[1]}.</Text>
          <InlineText text={numMatch[2]} baseStyle={[baseText, mdStyles.bulletText]} />
        </View>
      );
      i++;
      continue;
    }

    // Plain paragraph
    blocks.push(<InlineText key={i} text={line} baseStyle={[baseText, mdStyles.para]} />);
    i++;
  }

  return <View>{blocks}</View>;
}

// ── Animated typing dots ──────────────────────────────────────
function TypingIndicator({ label }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, idx) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(idx * 180),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - idx) * 180),
        ])
      )
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  }, []);

  return (
    <View style={styles.bubbleRow}>
      <View style={styles.avatarSmall}>
        <Text style={styles.avatarSmallText}>AI</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
        {label ? (
          <Text style={styles.typingLabel}>{label}</Text>
        ) : (
          <View style={styles.dotsRow}>
            {dots.map((dot, i) => (
              <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Message bubble ────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <MarkdownBlock content={msg.content} isUser={isUser} />
        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeAI]}>
          {formatTime(msg.time)}
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function AIAssistantScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: text, time: new Date() };
    const history = messages
      .filter(m => m.id !== 'init')
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    const isSendAction = /\b(send|dispatch|deliver)\b/i.test(text);
    setLoadingLabel(isSendAction ? '⟳ Sending follow-ups...' : '');

    try {
      const { reply } = await api.aiChat({ message: text, history });
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        time: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
        time: new Date(),
      }]);
    } finally {
      setLoading(false);
      setLoadingLabel('');
    }
  };

  // Group by date
  const grouped = [];
  let lastDate = null;
  messages.forEach((msg) => {
    const d = new Date(msg.time).toDateString();
    if (d !== lastDate) {
      grouped.push({ type: 'date', label: formatDateLabel(msg.time), id: `date-${d}` });
      lastDate = d;
    }
    grouped.push({ type: 'msg', msg });
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navy} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>SL</Text>
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.headerName}>Collection Assistant</Text>
            <Text style={styles.headerOnline}>ONLINE</Text>
          </View>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>⚙</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {grouped.map((item) => {
            if (item.type === 'date') {
              return (
                <View key={item.id} style={styles.dateSep}>
                  <Text style={styles.dateSepText}>{item.label}</Text>
                </View>
              );
            }
            return <Bubble key={item.msg.id} msg={item.msg} />;
          })}

          {loading && <TypingIndicator label={loadingLabel} />}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Type your inquiry..."
              placeholderTextColor={COLORS.grayLight}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              onPress={send}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Markdown styles ───────────────────────────────────────────
const mdStyles = StyleSheet.create({
  aiText:   { color: COLORS.navy, fontSize: SIZES.md, lineHeight: 21, ...FONTS.regular },
  userText: { color: COLORS.white, fontSize: SIZES.md, lineHeight: 21, ...FONTS.medium },
  bold:     { ...FONTS.bold },
  italic:   { fontStyle: 'italic' },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: SIZES.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  heading:  { fontSize: SIZES.base, ...FONTS.bold, marginBottom: 2 },
  para:     { marginVertical: 1 },
  spacer:   { height: 6 },
  divider:  { height: 1, marginVertical: 8, borderRadius: 1 },
  dividerAI:   { backgroundColor: COLORS.border },
  dividerUser: { backgroundColor: 'rgba(255,255,255,0.25)' },
  bulletRow:   { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 1 },
  bulletDot:   { marginRight: 6, lineHeight: 21 },
  bulletText:  { flex: 1, lineHeight: 21 },
});

// ── Component styles ──────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.lightBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft:       { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: COLORS.white, fontSize: SIZES.base, ...FONTS.extraBold },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#2ECC71',
    borderWidth: 2, borderColor: COLORS.navy,
  },
  headerName:   { color: COLORS.white, fontSize: SIZES.base, ...FONTS.bold },
  headerOnline: { color: '#2ECC71', fontSize: SIZES.xs, ...FONTS.semiBold, letterSpacing: 0.8, marginTop: 1 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconText: { color: COLORS.white, fontSize: 18 },

  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },

  dateSep:     { alignItems: 'center', marginVertical: 12 },
  dateSepText: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    color: COLORS.gray,
    fontSize: SIZES.xs, ...FONTS.semiBold,
    letterSpacing: 0.8,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20,
  },

  bubbleRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 4, maxWidth: '88%' },
  bubbleRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

  avatarSmall: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarSmallText: { color: COLORS.white, fontSize: 9, ...FONTS.extraBold },

  bubble:    { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  bubbleAI:  {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  bubbleUser: { backgroundColor: COLORS.navy, borderBottomRightRadius: 4 },

  bubbleTime:     { fontSize: 10, marginTop: 6 },
  bubbleTimeAI:   { color: COLORS.grayLight },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.5)' },

  /* Typing dots */
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
  dotsRow:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.navy },
  typingLabel:  { color: COLORS.navy, fontSize: SIZES.sm, ...FONTS.semiBold },

  inputBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  inputRow:   { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: SIZES.md,
    color: COLORS.navy,
    maxHeight: 120,
    ...FONTS.regular,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.grayLight },
  sendIcon: { color: COLORS.white, fontSize: 16, marginLeft: 2 },
});
