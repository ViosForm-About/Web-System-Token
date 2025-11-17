// ==================== API SERVICE ====================
class ApiService {
  static async request(endpoint, options = {}) {
    const token = AuthManager.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      // Gunakan path relative untuk Vercel
      const response = await fetch(`/api${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Tidak dapat terhubung ke server');
      }
      
      throw error;
    }
  }

  static async login(username, password) {
    return this.request('/login', {
      method: 'POST',
      body: { username, password }
    });
  }

  static async getTokens() {
    return this.request('/tokens');
  }

  static async addToken(token) {
    return this.request('/tokens', {
      method: 'POST',
      body: { token }
    });
  }

  static async deleteToken(id) {
    return this.request(`/tokens?id=${id}`, {
      method: 'DELETE'
    });
  }
}
