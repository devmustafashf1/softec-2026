import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/env';

const BASE_URL = API_BASE_URL;

// ── Token helpers ────────────────────────────────────────────
const TOKEN_KEY         = '@auth_token';
const REFRESH_TOKEN_KEY = '@refresh_token';

export const tokenStorage = {
  async getToken()              { return AsyncStorage.getItem(TOKEN_KEY); },
  async setToken(token)         { return AsyncStorage.setItem(TOKEN_KEY, token); },
  async getRefreshToken()       { return AsyncStorage.getItem(REFRESH_TOKEN_KEY); },
  async setRefreshToken(token)  { return AsyncStorage.setItem(REFRESH_TOKEN_KEY, token); },
  async clear()                 {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ── Base fetch wrapper ────────────────────────────────────────
async function request(path, options = {}, isRetry = false) {
  const token = await tokenStorage.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Auto-refresh token on 401 and retry once
  if (res.status === 401 && !isRetry && path !== '/auth/refresh' && path !== '/auth/login') {
    try {
      const refresh_token = await tokenStorage.getRefreshToken();
      if (refresh_token) {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          await tokenStorage.setToken(refreshData.token);
          await tokenStorage.setRefreshToken(refreshData.refresh_token);
          return request(path, options, true);
        }
      }
    } catch {
      // refresh failed — fall through to throw original error
    }
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// ── Auth API ─────────────────────────────────────────────────
export const api = {
  // Health check
  async health() {
    return request('/health');
  },

  // Register a new admin/agent account
  async register({ companyName, industry, contactPerson, email, password }) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        fullName:    contactPerson,
        companyName: companyName,
        industry:    industry,
      }),
    });
  },

  // Login — stores token automatically
  async login({ email, password }) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Persist tokens for subsequent requests
    await tokenStorage.setToken(data.token);
    await tokenStorage.setRefreshToken(data.refresh_token);

    return data;
  },

  // Logout — clears stored tokens
  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Even if the server call fails, clear local tokens
    } finally {
      await tokenStorage.clear();
    }
  },

  // Get the currently authenticated user
  async me() {
    return request('/auth/me');
  },

  // Client login via username (not email)
  async clientLogin({ username, password }) {
    const data = await request('/auth/client-login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    await tokenStorage.setToken(data.token);
    await tokenStorage.setRefreshToken(data.refresh_token);
    return data; // { token, refresh_token, user: { username, full_name, total_balance, ... } }
  },

  // ── User management (admin) ───────────────────────────────
  async listUsers() {
    return request('/users');
  },

  async createUser({ fullName, username, password, email, companyName, totalBalance, amountPaid, nextReview, accountStatus }) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, password, email, companyName, totalBalance, amountPaid, nextReview, accountStatus }),
    });
  },

  async toggleUserStatus(id, is_active) {
    return request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
    });
  },

  // ── Dashboard ─────────────────────────────────────────────
  async getDashboardStats() {
    return request('/accounts/stats');
  },

  async getClientsByStatus(statuses) {
    return request(`/accounts/clients?statuses=${statuses.join(',')}`);
  },

  // ── Account management ────────────────────────────────────
  async changeAccountStatus(id, account_status) {
    return request(`/accounts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ account_status }),
    });
  },

  async generateMessage(id) {
    return request(`/accounts/${id}/generate-message`, { method: 'POST' });
  },

  async getAccountMessages(id) {
    return request(`/accounts/${id}/messages`);
  },

  async deleteMessage(accountId, messageId) {
    return request(`/accounts/${accountId}/messages/${messageId}`, { method: 'DELETE' });
  },

  async sendMessage(accountId, messageId, { sendEmail = false } = {}) {
    return request(`/accounts/${accountId}/messages/${messageId}/send`, {
      method: 'PATCH',
      body: JSON.stringify({ sendEmail }),
    });
  },

  async getClientFollowups() {
    return request('/client/followups');
  },

  async markFollowupsSeen() {
    return request('/client/followups/seen', { method: 'PATCH' });
  },

  // ── Payment proofs ────────────────────────────────────────
  async submitPaymentProof({ imageUri, mimeType, referenceNumber, note }) {
    const token = await tokenStorage.getToken();
    const formData = new FormData();
    formData.append('receipt', { uri: imageUri, type: mimeType || 'image/jpeg', name: 'receipt.jpg' });
    formData.append('referenceNumber', referenceNumber);
    if (note) formData.append('note', note);

    const res = await fetch(`${BASE_URL}/client/payment-proof`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || `Upload failed (${res.status})`);
    return data;
  },

  async getAllPaymentProofs() {
    return request('/accounts/payment-proofs');
  },

  async getPaymentProofs(id) {
    return request(`/accounts/${id}/payment-proofs`);
  },

  async updateProofStatus(id, proofId, status) {
    return request(`/accounts/${id}/payment-proofs/${proofId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deletePaymentProof(id, proofId) {
    return request(`/accounts/${id}/payment-proofs/${proofId}`, { method: 'DELETE' });
  },

  // ── AI Assistant ──────────────────────────────────────────
  async aiChat({ message, history = [] }) {
    return request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },

  // Exchange refresh token for a new access token
  async refreshToken() {
    const refresh_token = await tokenStorage.getRefreshToken();
    if (!refresh_token) throw new Error('No refresh token available');

    const data = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    });

    await tokenStorage.setToken(data.token);
    await tokenStorage.setRefreshToken(data.refresh_token);

    return data;
  },
};
