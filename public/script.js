// ==================== AUTH TOKEN MANAGEMENT ====================
class AuthManager {
    static getToken() {
        return localStorage.getItem('syaaBotToken');
    }

    static setToken(token) {
        localStorage.setItem('syaaBotToken', token);
    }

    static removeToken() {
        localStorage.removeItem('syaaBotToken');
        localStorage.removeItem('syaaBotUser');
    }

    static getUser() {
        const user = localStorage.getItem('syaaBotUser');
        return user ? JSON.parse(user) : null;
    }

    static setUser(user) {
        localStorage.setItem('syaaBotUser', JSON.stringify(user));
    }

    static isAuthenticated() {
        return !!this.getToken();
    }

    static logout() {
        this.removeToken();
        window.location.href = '/login';
    }
}

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
            const response = await fetch(`/api${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
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

// ==================== UTILITY FUNCTIONS ====================
class Utils {
    static formatToken(token) {
        if (!token) return '';
        
        const length = token.length;
        const visibleChars = Math.floor(length / 2);
        const hiddenPart = '*'.repeat(length - visibleChars);
        
        return token.substring(0, visibleChars) + hiddenPart;
    }

    static showNotification(message, type = 'success', duration = 3000) {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            ${type === 'success' ? 'background: linear-gradient(45deg, #4caf50, #45a049);' : 'background: linear-gradient(45deg, #f44336, #da190b);'}
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    static setLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const btnLoading = button.querySelector('.btn-loading');
        
        if (isLoading) {
            btnText.classList.add('hide');
            btnLoading.classList.add('show');
            button.disabled = true;
        } else {
            btnText.classList.remove('hide');
            btnLoading.classList.remove('show');
            button.disabled = false;
        }
    }
}

// ==================== LOGIN PAGE FUNCTIONALITY ====================
if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', function() {
        const loginForm = document.getElementById('loginForm');
        const messageDiv = document.getElementById('message');
        const loginBtn = loginForm?.querySelector('.login-btn');

        // Redirect jika sudah login
        if (AuthManager.isAuthenticated()) {
            window.location.href = '/dashboard';
            return;
        }

        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();
                
                if (!username || !password) {
                    Utils.showNotification('Username dan password harus diisi', 'error');
                    return;
                }

                Utils.setLoading(loginBtn, true);
                messageDiv.innerHTML = '';

                try {
                    const result = await ApiService.login(username, password);
                    
                    if (result.success) {
                        AuthManager.setToken(result.token);
                        AuthManager.setUser(result.user);
                        
                        Utils.showNotification('Login berhasil! Mengalihkan...', 'success');
                        
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                    }
                } catch (error) {
                    messageDiv.innerHTML = `
                        <div class="message error">
                            ${error.message || 'Login gagal. Periksa username dan password Anda.'}
                        </div>
                    `;
                } finally {
                    Utils.setLoading(loginBtn, false);
                }
            });
        }
    });
}

// ==================== DASHBOARD PAGE FUNCTIONALITY ====================
if (window.location.pathname.includes('dashboard.html')) {
    class Dashboard {
        constructor() {
            this.currentUser = AuthManager.getUser();
            this.tokens = [];
            this.init();
        }

        init() {
            this.checkAuth();
            this.bindEvents();
            this.loadUserInfo();
            this.loadTokens();
        }

        checkAuth() {
            if (!AuthManager.isAuthenticated() || !this.currentUser) {
                window.location.href = '/login';
                return;
            }
        }

        bindEvents() {
            // Logout button
            document.getElementById('logoutBtn').addEventListener('click', () => {
                AuthManager.logout();
            });

            // Add token button
            document.getElementById('addTokenBtn').addEventListener('click', () => {
                this.showAddTokenModal();
            });

            // Modal events
            document.querySelector('.close').addEventListener('click', () => {
                this.hideAddTokenModal();
            });

            document.getElementById('cancelBtn').addEventListener('click', () => {
                this.hideAddTokenModal();
            });

            // Token form submission
            document.getElementById('tokenForm').addEventListener('submit', (e) => {
                this.handleAddToken(e);
            });

            // Close modal on outside click
            document.getElementById('tokenModal').addEventListener('click', (e) => {
                if (e.target.id === 'tokenModal') {
                    this.hideAddTokenModal();
                }
            });
        }

        loadUserInfo() {
            const welcomeElement = document.getElementById('userWelcome');
            if (welcomeElement && this.currentUser) {
                welcomeElement.textContent = `Welcome, ${this.currentUser.username} (${this.currentUser.role})`;
            }
        }

        async loadTokens() {
            try {
                const result = await ApiService.getTokens();
                if (result.success) {
                    this.tokens = result.tokens || [];
                    this.renderTokens();
                }
            } catch (error) {
                Utils.showNotification('Gagal memuat token', 'error');
                console.error('Load tokens error:', error);
            }
        }

        renderTokens() {
            const tokenList = document.getElementById('tokenList');
            const emptyState = document.getElementById('emptyState');
            const tokenCount = document.getElementById('tokenCount');

            // Update token count
            tokenCount.textContent = `${this.tokens.length} token${this.tokens.length !== 1 ? 's' : ''}`;

            if (this.tokens.length === 0) {
                tokenList.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            
            tokenList.innerHTML = this.tokens.map((token, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        <div class="token-display" title="Token lengkap: ${token.token}">
                            ${Utils.formatToken(token.token)}
                        </div>
                    </td>
                    <td class="creator-info">
                        <div>${token.createdBy}</div>
                        <small>${new Date(token.createdAt).toLocaleDateString('id-ID')}</small>
                    </td>
                    <td>
                        <button class="delete-btn" data-id="${token.id}">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `).join('');

            // Add delete event listeners
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const tokenId = e.target.getAttribute('data-id');
                    this.handleDeleteToken(parseInt(tokenId));
                });
            });
        }

        showAddTokenModal() {
            document.getElementById('tokenModal').style.display = 'block';
            document.getElementById('tokenInput').focus();
        }

        hideAddTokenModal() {
            document.getElementById('tokenModal').style.display = 'none';
            document.getElementById('tokenForm').reset();
        }

        async handleAddToken(e) {
            e.preventDefault();
            
            const tokenInput = document.getElementById('tokenInput');
            const token = tokenInput.value.trim();
            const submitBtn = document.querySelector('.submit-btn');

            if (!token) {
                Utils.showNotification('Token tidak boleh kosong', 'error');
                tokenInput.focus();
                return;
            }

            Utils.setLoading(submitBtn, true);

            try {
                const result = await ApiService.addToken(token);
                
                if (result.success) {
                    Utils.showNotification('Token berhasil ditambahkan', 'success');
                    this.hideAddTokenModal();
                    this.loadTokens(); // Refresh token list
                }
            } catch (error) {
                Utils.showNotification(error.message || 'Gagal menambahkan token', 'error');
            } finally {
                Utils.setLoading(submitBtn, false);
            }
        }

        async handleDeleteToken(tokenId) {
            if (!confirm('Apakah Anda yakin ingin menghapus token ini?')) {
                return;
            }

            try {
                const result = await ApiService.deleteToken(tokenId);
                
                if (result.success) {
                    Utils.showNotification('Token berhasil dihapus', 'success');
                    this.loadTokens(); // Refresh token list
                }
            } catch (error) {
                Utils.showNotification(error.message || 'Gagal menghapus token', 'error');
            }
        }
    }

    // Initialize dashboard when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        new Dashboard();
    });
}

// ==================== GLOBAL STYLES FOR NOTIFICATIONS ====================
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
`;
document.head.appendChild(notificationStyles);