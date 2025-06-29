import { User, LoginCredentials, RegisterData } from '../types/auth';

class AuthService {
  private readonly STORAGE_KEY = 'fasttrack_auth';
  private readonly USERS_KEY = 'fasttrack_users';

  // Simple password hashing (in production, use bcrypt or similar)
  private hashPassword(password: string): string {
    // This is a simple hash for demo purposes
    // In production, use proper bcrypt or similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36) + password.length.toString(36);
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  private getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    if (!users) return [];
    
    try {
      return JSON.parse(users).map((user: any) => ({
        ...user,
        createdAt: new Date(user.createdAt),
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
      }));
    } catch {
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private generateUserId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Create default admin user if none exists
  private ensureAdminUser(): void {
    const users = this.getUsers();
    const adminExists = users.some(user => user.isAdmin);
    
    if (!adminExists) {
      const adminUser: User = {
        id: this.generateUserId(),
        username: 'admin',
        email: 'admin@fasttrack.local',
        passwordHash: this.hashPassword('admin123'), // Default admin password
        isAdmin: true,
        createdAt: new Date(),
        preferences: {
          theme: 'blue',
          notifications: true,
          dataRetention: 365
        }
      };
      
      users.push(adminUser);
      this.saveUsers(users);
    }
  }

  async register(data: RegisterData): Promise<User> {
    this.ensureAdminUser();
    
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const users = this.getUsers();
    
    // Check if username or email already exists
    if (users.some(user => user.username.toLowerCase() === data.username.toLowerCase())) {
      throw new Error('Username already exists');
    }
    
    if (users.some(user => user.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    const newUser: User = {
      id: this.generateUserId(),
      username: data.username,
      email: data.email,
      passwordHash: this.hashPassword(data.password),
      isAdmin: false,
      createdAt: new Date(),
      preferences: {
        theme: 'blue',
        notifications: true,
        dataRetention: 90
      }
    };

    users.push(newUser);
    this.saveUsers(users);

    // Auto-login after registration
    this.setCurrentUser(newUser);
    
    return newUser;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    this.ensureAdminUser();
    
    const users = this.getUsers();
    const user = users.find(u => 
      u.username.toLowerCase() === credentials.username.toLowerCase()
    );

    if (!user || !this.verifyPassword(credentials.password, user.passwordHash)) {
      throw new Error('Invalid username or password');
    }

    // Update last login
    user.lastLogin = new Date();
    this.saveUsers(users);
    this.setCurrentUser(user);

    return user;
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.STORAGE_KEY);
    if (!userData) return null;

    try {
      const user = JSON.parse(userData);
      return {
        ...user,
        createdAt: new Date(user.createdAt),
        lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined
      };
    } catch {
      return null;
    }
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) throw new Error('User not found');

    // Merge updates
    const updatedUser = { ...users[userIndex], ...updates };
    users[userIndex] = updatedUser;
    
    this.saveUsers(users);
    this.setCurrentUser(updatedUser);
    
    return updatedUser;
  }

  async updateAvatar(avatarDataUrl: string): Promise<User> {
    return this.updateProfile({ avatar: avatarDataUrl });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('Not authenticated');

    if (!this.verifyPassword(currentPassword, currentUser.passwordHash)) {
      throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    await this.updateProfile({ 
      passwordHash: this.hashPassword(newPassword) 
    });
  }

  // Admin functions
  getAllUsers(): User[] {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.isAdmin) throw new Error('Admin access required');
    
    return this.getUsers();
  }

  async deleteUser(userId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.isAdmin) throw new Error('Admin access required');
    
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    this.saveUsers(filteredUsers);
  }

  async toggleUserAdmin(userId: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (!currentUser?.isAdmin) throw new Error('Admin access required');
    
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) throw new Error('User not found');
    
    users[userIndex].isAdmin = !users[userIndex].isAdmin;
    this.saveUsers(users);
  }
}

export const authService = new AuthService();