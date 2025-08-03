// Frontend Authentication Service
class AuthService {
  constructor() {
    this.baseURL = '';
    this.token = localStorage.getItem('token');
  }

  // Get auth headers for API requests
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data);
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data);
        return { success: true, data };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Set authentication data
  setAuthData(data) {
    if (data.accessToken) {
      localStorage.setItem('token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    this.token = data.accessToken;
  }

  // Logout user
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.token = null;
    // Don't auto-redirect - let the app handle it
  }

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        this.setAuthData(data);
        return { success: true, data };
      } else {
        // Clear tokens but don't auto-redirect
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        this.token = null;
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens but don't auto-redirect
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      this.token = null;
      return { success: false, error: 'Token refresh failed' };
    }
  }

  // Make authenticated API request
  async apiRequest(url, options = {}) {
    const headers = this.getAuthHeaders();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const refreshResult = await this.refreshToken();
        if (refreshResult.success) {
          // Retry the original request with new token
          const retryHeaders = this.getAuthHeaders();
          return fetch(url, {
            ...options,
            headers: {
              ...retryHeaders,
              ...options.headers,
            },
          });
        } else {
          throw new Error('Authentication failed');
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Check user role
  hasRole(requiredRole) {
    const user = this.getCurrentUser();
    return user && user.role === requiredRole;
  }

  // Check if user is organizer
  isOrganizer() {
    return this.hasRole('organizer');
  }

  // Check if user is attendee
  isAttendee() {
    return this.hasRole('attendee');
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;