import { User, LoginCredentials, RegisterData } from '../types/auth';

class AuthService {
  private readonly API_BASE_URL = '/api/auth';
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Initialize authentication state
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load token from localStorage
    this.authToken = localStorage.getItem('fasttrack_token');
    
    if (this.authToken) {
      try {
        // Validate token with server and load user data
        await this.loadCurrentUser();
      } catch (error) {
        console.error('Failed to validate stored token:', error);
        this.clearAuth();
      }
    }
  }

  // Ensure initialization is complete before any operation
  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  private async loadCurrentUser(): Promise<void> {
    if (!this.authToken) return;

    const response = await fetch(`${this.API_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      this.currentUser = {
        ...data.user,
        createdAt: new Date(data.user.createdAt),
        lastLogin: data.user.lastLogin ? new Date(data.user.lastLogin) : undefined
      };
    } else {
      // Token is invalid, clear it
      throw new Error('Invalid token');
    }
  }

  private setAuth(user: User, token: string): void {
    this.currentUser = user;
    this.authToken = token;
    localStorage.setItem('fasttrack_token', token);
  }

  private clearAuth(): void {
    this.currentUser = null;
    this.authToken = null;
    localStorage.removeItem('fasttrack_token');
  }

  async register(data: RegisterData): Promise<User> {
    await this.ensureInitialized();

    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const response = await fetch(`${this.API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    const user = {
      ...result.user,
      createdAt: new Date(result.user.createdAt),
      lastLogin: result.user.lastLogin ? new Date(result.user.lastLogin) : undefined
    };

    this.setAuth(user, result.token);
    return user;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    await this.ensureInitialized();

    const response = await fetch(`${this.API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    const user = {
      ...result.user,
      createdAt: new Date(result.user.createdAt),
      lastLogin: result.user.lastLogin ? new Date(result.user.lastLogin) : undefined
    };

    this.setAuth(user, result.token);
    return user;
  }

  async logout(): Promise<void> {
    await this.ensureInitialized();

    if (this.authToken) {
      try {
        await fetch(`${this.API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('Logout request failed:', error);
      }
    }

    this.clearAuth();
  }

  async getCurrentUser(): Promise<User | null> {
    await this.ensureInitialized();
    return this.currentUser;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  async isAuthenticated(): Promise<boolean> {
    await this.ensureInitialized();
    return this.currentUser !== null && this.authToken !== null;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    await this.ensureInitialized();

    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    const result = await response.json();
    const updatedUser = {
      ...result.user,
      createdAt: new Date(result.user.createdAt),
      lastLogin: result.user.lastLogin ? new Date(result.user.lastLogin) : undefined
    };

    this.currentUser = updatedUser;
    return updatedUser;
  }

  async updateAvatar(avatarDataUrl: string): Promise<User> {
    return this.updateProfile({ avatar: avatarDataUrl });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const response = await fetch(`${this.API_BASE_URL}/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    await this.ensureInitialized();

    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    const users = await response.json();
    return users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
    }));
  }

  async deleteUser(userId: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  }

  async toggleUserAdmin(userId: string): Promise<void> {
    await this.ensureInitialized();

    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/admin/users/${userId}/admin`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
  }
}

export const authService = new AuthService();