const BASE_URL = 'http://localhost:5000/api';

export const api = {
  async health() {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  async login({ email, password }) {
    // TODO: wire to real auth endpoint
    // For now, mock a successful login
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          resolve({ success: true, token: 'mock-token-123', user: { email } });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  },

  async register({ companyName, industry, contactPerson, email, password }) {
    // TODO: wire to real register endpoint
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          resolve({ success: true, message: 'Account created' });
        } else {
          reject(new Error('Registration failed'));
        }
      }, 1000);
    });
  },
};
