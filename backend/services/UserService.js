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

    await this.loadUsers();
    await this.loadSessions();
    await this.createDefaultAdmin();
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
      console.log(`📚 Loaded ${this.users.size} users`);
    } catch (error) {
      console.log('📚 No existing users file found, starting fresh');
      this.users.clear();
    }
  }

  async saveUsers() {
    const usersArray = Array.from(this.users.values());
    await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
  }

  async loadSessions() {
    try {
      const data = await fs.readFile(this.sessionsFile, 'utf8');
      const sessionsArray = JSON.parse(data);
      this.sessions.clear();
      sessionsArray.forEach(session => {
        this.sessions.set(session.token, session);
      });
      console.log(`🔐 Loaded ${this.sessions.size} active sessions`);
    } catch (error) {
      console.log('🔐 No existing sessions file found, starting fresh');
      this.sessions.clear();
    }
  }

  async saveSessions() {
    const sessionsArray = Array.from(this.sessions.values());
    await fs.writeFile(this.sessionsFile, JSON.stringify(sessionsArray, null, 2));
  }

  async createDefaultAdmin() {
    const adminExists = Array.from(this.users.values()).some(user => user.isAdmin);
    
    if (!adminExists) {
      const adminUser = new User({
        id: 'admin-' + Date.now(),
        username: 'admin',
        email: 'admin@fasttrack.local',
        passwordHash: await bcrypt.hash('admin123', 10),
        isAdmin: true
      });
      
      this.users.set(adminUser.id, adminUser);
      await this.saveUsers();
      console.log('👑 Default admin user created (admin/admin123)');
    }
  }

  async register(userData) {
    const { username, email, password } = userData;
    
    // Check if user already exists
    const existingUser = Array.from(this.users.values()).find(
      user => user.username === username || user.email === email
    );
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create new user
    const user = new User({
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      username,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      isAdmin: false
    });
    
    this.users.set(user.id, user);
    await this.saveUsers();
    
    return user.toJSON();
  }

  async login(credentials) {
    const { username, password } = credentials;
    
    const user = Array.from(this.users.values()).find(
      u => u.username === username || u.email === username
    );
    
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    await this.saveUsers();
    
    // Create session
    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.isAdmin },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
    
    const session = {
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    this.sessions.set(token, session);
    await this.saveSessions();
    
    return { user: user.toJSON(), token };
  }

  async logout(token) {
    this.sessions.delete(token);
    await this.saveSessions();
  }

  async validateToken(token) {
    try {
      const session = this.sessions.get(token);
      if (!session) {
        return null;
      }
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        this.sessions.delete(token);
        await this.saveSessions();
        return null;
      }
      
      const decoded = jwt.verify(token, this.jwtSecret);
      const user = this.users.get(decoded.userId);
      
      return user ? user.toJSON() : null;
    } catch (error) {
      return null;
    }
  }

  async updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update allowed fields
    if (updates.username) user.username = updates.username;
    if (updates.email) user.email = updates.email;
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.password) {
      user.passwordHash = await bcrypt.hash(updates.password, 10);
    }
    
    user.updatedAt = new Date().toISOString();
    await this.saveUsers();
    
    return user.toJSON();
  }

  async getAllUsers() {
    return Array.from(this.users.values()).map(user => user.toJSON());
  }

  async deleteUser(userId) {
    const deleted = this.users.delete(userId);
    if (deleted) {
      await this.saveUsers();
      
      // Remove user's sessions
      const userSessions = Array.from(this.sessions.entries())
        .filter(([token, session]) => session.userId === userId);
      
      userSessions.forEach(([token]) => this.sessions.delete(token));
      await this.saveSessions();
    }
    return deleted;
  }

  async getUserStats() {
    const users = Array.from(this.users.values());
    return {
      total: users.length,
      admins: users.filter(u => u.isAdmin).length,
      regular: users.filter(u => !u.isAdmin).length,
      activeSessions: this.sessions.size
    };
  }
}

module.exports = UserService;