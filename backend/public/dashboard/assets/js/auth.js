// Authentication utilities
class AuthManager {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('admin_token');
    }

    // Get authentication headers (no auth required)
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    // Check if user is authenticated (always return true - no auth required)
    isAuthenticated() {
        return true;
    }

    // Login user
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.token = data.data.token;
                localStorage.setItem('admin_token', this.token);
                localStorage.setItem('admin_user', JSON.stringify(data.data.user));
                return { success: true, data: data.data };
            } else {
                return { success: false, error: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    // Logout user
    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.baseURL}/api/auth/logout`, {
                    method: 'POST',
                    headers: this.getAuthHeaders()
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.href = '/dashboard/login';
        }
    }

    // Verify token
    async verifyToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/api/auth/verify`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                return data.success;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.logout();
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('admin_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // Redirect to login if not authenticated (disabled - always allow access)
    requireAuth() {
        return true; // Always allow access
    }

    // Redirect to dashboard if already authenticated
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = '/dashboard/admin';
            return true;
        }
        return false;
    }
}

// Global auth manager instance
const authManager = new AuthManager();

// Utility functions
function showAlert(message, type = 'info', container = 'alert-container') {
    const alertContainer = document.getElementById(container);
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function showLoading(element, show = true) {
    if (show) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// API utility functions
async function apiRequest(endpoint, options = {}) {
    const defaultOptions = {
        headers: authManager.getAuthHeaders()
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${authManager.baseURL}${endpoint}`, finalOptions);
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                authManager.logout();
                return null;
            }
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

// Format date utility
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Truncate text utility
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Category badge utility
function getCategoryBadge(category) {
    const badges = {
        'mern': 'success',
        'android': 'info',
        'basicweb': 'warning',
        'lamp': 'danger'
    };
    
    const badgeClass = badges[category] || 'secondary';
    return `<span class="badge bg-${badgeClass}">${category.toUpperCase()}</span>`;
}

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    // Authentication disabled - no checks required
    console.log('Dashboard loaded - authentication disabled');
});
