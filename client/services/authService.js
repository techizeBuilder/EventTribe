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

  // Refresh token (simplified for persistent tokens)
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('No refresh token available - using persistent token');
        return { success: true, data: { accessToken: this.token } };
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
        // For persistent tokens, don't clear tokens on refresh failure
        console.log('Token refresh failed but keeping persistent session');
        return { success: true, data: { accessToken: this.token } };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // For persistent tokens, don't clear tokens on network errors
      console.log('Using existing persistent token');
      return { success: true, data: { accessToken: this.token } };
    }
  }

  // Make authenticated API request (simplified for persistent tokens)
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

      // With persistent tokens, 401 errors are less likely
      // But still handle them gracefully
      if (response.status === 401) {
        console.log('Authentication issue - check if user needs to login again');
        // For persistent sessions, we don't automatically retry
        // Let the component handle the 401 response
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