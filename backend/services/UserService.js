const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class UserService {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.usersFile = path.join(dataDir, 'users.json');
    this.sessionsFile = path.join(dataDir, 'sessions.json');
    this.userDataDir = path.join(dataDir, 'users');
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.users = new Map();
    this.sessions = new Map();
  }

  async initialize() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }

    // Ensure user data directory exists
    try {
      await fs.access(this.userDataDir);
    } catch {
      await fs.mkdir(this.userDataDir, { recursive: true });
    }

    await this.loadUsers();
    await this.loadSessions();
    await this.createDefaultAdmin();
    
    // Clean up expired sessions on startup
    await this.cleanupExpiredSessions();
    
    // Set up periodic cleanup and save every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions().catch(console.error);
      this.saveUsers().catch(console.error);
      this.saveSessions().catch(console.error);
    }, 5 * 60 * 1000);
    
    console.log(`💾 User data will be persisted to: ${this.dataDir}`);
    console.log(`👥 User accounts file: ${this.usersFile}`);
    console.log(`🔐 Sessions file: ${this.sessionsFile}`);
  }

  // Get user-specific data directory
  getUserDataDirectory(username) {
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.userDataDir, sanitizedUsername);
  }

  // Ensure user data directory exists
  async ensureUserDataDirectory(username) {
    const userDir = this.getUserDataDirectory(username);
    try {
      await fs.access(userDir);
    } catch {
      await fs.mkdir(userDir, { recursive: true });
      console.log(`📁 Created data directory for user: ${username}`);
    }
    return userDir;
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.usersFile, 'utf8');
      const usersArray = JSON.parse(data);
      this.users.clear();
      usersArray.forEach(userData => {
        const user = User.fromJSON(userData);
        this.users.set(user.id, user);
      });
      console.log(`📚 Loaded ${this.users.size} users from persistent storage`);
      
      // Ensure all users have data directories
      for (const user of this.users.values()) {
        await this.ensureUserDataDirectory(user.username);
      }
    } catch (error) {
      console.log('📚 No existing users file found, starting fresh');
      this.users.clear();
    }
  }

  async saveUsers() {
    const usersArray = Array.from(this.users.values());
    await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
    console.log(`💾 Saved ${usersArray.length} users to persistent storage`);
  }

  async loadSessions() {
    try {
      const data = await fs.readFile(this.sessionsFile, 'utf8');
      const sessionsArray = JSON.parse(data);
      this.sessions.clear();
      sessionsArray.forEach(session => {
        // Only load non-expired sessions
        if (new Date() <= new Date(session.expiresAt)) {
          this.sessions.set(session.token, session);
        }
      });
      console.log(`🔐 Loaded ${this.sessions.size} active sessions from persistent storage`);
    } catch (error) {
      console.log('🔐 No existing sessions file found, starting fresh');
      this.sessions.clear();
    }
  }

  async saveSessions() {
    const sessionsArray = Array.from(this.sessions.values());
    await fs.writeFile(this.sessionsFile, JSON.stringify(sessionsArray, null, 2));
    console.log(`🔐 Saved ${sessionsArray.length} sessions to persistent storage`);
  }

  async cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [token, session] of this.sessions.entries()) {
      if (now > new Date(session.expiresAt)) {
        this.sessions.delete(token);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      await this.saveSessions();
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  async createDefaultAdmin() {
    const adminExists = Array.from(this.users.values()).some(user => user.isAdmin);
    
    if (!adminExists) {
      const adminUser = new User({
        id: 'admin-' + Date.now(),
        username: 'admin',
        email: 'admin@fasttrack.local',
        passwordHash: await bcrypt.hash('admin123', 12),
        isAdmin: true
      });
      
      this.users.set(adminUser.id, adminUser);
      await this.saveUsers();
      console.log('👑 Default admin user created (admin/admin123)');
    }
  }

  async register(userData) {
    const { username, email, password } = userData;
    
    // Validate input
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    
    if (!email || !email.includes('@')) {
      throw new Error('Valid email address is required');
    }
    
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Check if user already exists (case-insensitive)
    const existingUser = Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase() || 
             user.email.toLowerCase() === email.toLowerCase()
    );
    
    if (existingUser) {
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        throw new Error('Username already exists');
      }
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        throw new Error('Email already exists');
      }
    }
    
    // Create new user
    const user = new User({
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 12),
      isAdmin: false
    });
    
    this.users.set(user.id, user);
    await this.saveUsers();
    
    // Create user data directory
    await this.ensureUserDataDirectory(user.username);
    
    console.log(`👤 New user registered: ${user.username} (${user.email})`);
    return user.toJSON();
  }

  async login(credentials) {
    const { username, password } = credentials;
    
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Find user by username or email (case-insensitive)
    const user = Array.from(this.users.values()).find(
      u => u.username.toLowerCase() === username.toLowerCase() || 
           u.email.toLowerCase() === username.toLowerCase()
    );
    
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    await this.saveUsers();
    
    // Create session with extended expiry for cross-device persistence
    const sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin,
        sessionId: sessionId
      },
      this.jwtSecret,
      { expiresIn: '30d' } // 30 days for better cross-device experience
    );
    
    const session = {
      token,
      sessionId,
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastAccessed: new Date().toISOString(),
      userAgent: '',
      ipAddress: ''
    };
    
    this.sessions.set(token, session);
    await this.saveSessions();
    
    console.log(`🔑 User logged in: ${user.username} (session: ${sessionId})`);
    return { user: user.toJSON(), token };
  }

  async logout(token) {
    const session = this.sessions.get(token);
    if (session) {
      this.sessions.delete(token);
      await this.saveSessions();
      console.log(`🚪 User logged out: ${session.username} (session: ${session.sessionId})`);
    }
  }

  async logoutAllSessions(userId) {
    let loggedOutCount = 0;
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(token);
        loggedOutCount++;
      }
    }
    
    if (loggedOutCount > 0) {
      await this.saveSessions();
      console.log(`🚪 Logged out ${loggedOutCount} sessions for user ${userId}`);
    }
    
    return loggedOutCount;
  }

  async validateToken(token) {
    try {
      const session = this.sessions.get(token);
      if (!session) {
        console.log('🔍 Token not found in sessions');
        return null;
      }
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        console.log('🔍 Session expired, removing');
        this.sessions.delete(token);
        await this.saveSessions();
        return null;
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret);
      const user = this.users.get(decoded.userId);
      
      if (!user) {
        console.log('🔍 User not found, removing session');
        this.sessions.delete(token);
        await this.saveSessions();
        return null;
      }
      
      // Update last accessed time
      session.lastAccessed = new Date().toISOString();
      
      console.log(`🔍 Token validated for user: ${user.username}`);
      return user.toJSON();
    } catch (error) {
      console.log('🔍 Token validation failed:', error.message);
      this.sessions.delete(token);
      await this.saveSessions();
      return null;
    }
  }

  async updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check for username/email conflicts (case-insensitive)
    if (updates.username && updates.username !== user.username) {
      const existingUser = Array.from(this.users.values()).find(
        u => u.id !== userId && u.username.toLowerCase() === updates.username.toLowerCase()
      );
      if (existingUser) {
        throw new Error('Username already exists');
      }
      user.username = updates.username.trim();
    }
    
    if (updates.email && updates.email !== user.email) {
      const existingUser = Array.from(this.users.values()).find(
        u => u.id !== userId && u.email.toLowerCase() === updates.email.toLowerCase()
      );
      if (existingUser) {
        throw new Error('Email already exists');
      }
      user.email = updates.email.toLowerCase().trim();
    }
    
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.password) {
      user.passwordHash = await bcrypt.hash(updates.password, 12);
    }
    if (updates.isAdmin !== undefined) user.isAdmin = updates.isAdmin;
    
    user.updatedAt = new Date().toISOString();
    await this.saveUsers();
    
    console.log(`👤 User updated: ${user.username}`);
    return user.toJSON();
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
      throw new Error('Current password is incorrect');
    }
    
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }
    
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.updatedAt = new Date().toISOString();
    await this.saveUsers();
    
    console.log(`🔒 Password changed for user: ${user.username}`);
    return user.toJSON();
  }

  async getAllUsers() {
    return Array.from(this.users.values()).map(user => user.toJSON());
  }

  async deleteUser(userId) {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    
    // Remove user data directory
    try {
      const userDir = this.getUserDataDirectory(user.username);
      await fs.rmdir(userDir, { recursive: true });
      console.log(`🗂️ Removed data directory for user: ${user.username}`);
    } catch (error) {
      console.error(`Failed to remove user data directory: ${error.message}`);
    }
    
    const deleted = this.users.delete(userId);
    if (deleted) {
      await this.saveUsers();
      
      // Remove all user's sessions
      const userSessions = Array.from(this.sessions.entries())
        .filter(([token, session]) => session.userId === userId);
      
      userSessions.forEach(([token]) => this.sessions.delete(token));
      await this.saveSessions();
      
      console.log(`🗑️ User deleted: ${user.username} (${userSessions.length} sessions removed)`);
    }
    return deleted;
  }

  async toggleUserAdmin(userId) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    user.isAdmin = !user.isAdmin;
    user.updatedAt = new Date().toISOString();
    await this.saveUsers();
    
    console.log(`👑 Admin status toggled for user: ${user.username} (isAdmin: ${user.isAdmin})`);
    return user.toJSON();
  }

  async getUserStats() {
    const users = Array.from(this.users.values());
    const now = new Date();
    const activeSessions = Array.from(this.sessions.values())
      .filter(session => now <= new Date(session.expiresAt));
    
    return {
      total: users.length,
      admins: users.filter(u => u.isAdmin).length,
      regular: users.filter(u => !u.isAdmin).length,
      activeSessions: activeSessions.length,
      totalSessions: this.sessions.size
    };
  }

  async getActiveSessions(userId) {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .map(session => ({
        sessionId: session.sessionId,
        token: session.token.substring(0, 10) + '...',
        createdAt: session.createdAt,
        lastAccessed: session.lastAccessed,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent || 'Unknown',
        ipAddress: session.ipAddress || 'Unknown'
      }));
  }
}

module.exports = UserService;