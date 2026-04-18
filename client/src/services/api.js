import AsyncStorage from '@react-native-async-storage/async-storage';

// Android emulator → use 10.0.2.2
// Physical device / Expo Go → use your machine's LAN IP
const BASE_URL = 'http://192.168.0.181:5000/api';

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
async function request(path, options = {}) {
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

    return data; // { token, refresh_token, expires_at, user }
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

  async createUser({ fullName, username, password, companyName, totalBalance, amountPaid, nextReview, accountStatus }) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, password, companyName, totalBalance, amountPaid, nextReview, accountStatus }),
    });
  },

  async toggleUserStatus(id, is_active) {
    return request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active }),
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
