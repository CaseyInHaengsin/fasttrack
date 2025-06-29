const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');

class UserService {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.usersFile = path.join(dataDir, 'users.json');
    this.users = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      await fs.access(this.usersFile);
      const data = await fs.readFile(this.usersFile, 'utf8');
      const usersData = JSON.parse(data);
      
      for (const userData of usersData) {
        const user = new User(userData);
        this.users.set(user.id, user);
      }
    } catch (error) {
      // File doesn't exist, create with default admin user
      await this.createDefaultAdmin();
    }

    this.initialized = true;
  }

  async createDefaultAdmin() {
    const adminUser = new User({
      id: 'admin_' + Date.now().toString(36),
      username: 'admin',
      email: 'admin@fasttrack.local',
      passwordHash: await User.hashPassword('admin123'),
      isAdmin: true,
      preferences: {
        theme: 'blue',
        notifications: true,
        dataRetention: 365
      }
    });

    this.users.set(adminUser.id, adminUser);
    await this.saveUsers();
  }

  async saveUsers() {
    const usersArray = Array.from(this.users.values()).map(user => user.toJSON());
    await fs.writeFile(this.usersFile, JSON.stringify(usersArray, null, 2));
  }

  async createUser(userData) {
    await this.initialize();

    // Check if username or email already exists
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === userData.username.toLowerCase()) {
        throw new Error('Username already exists');
      }
      if (user.email.toLowerCase() === userData.email.toLowerCase()) {
        throw new Error('Email already exists');
      }
    }

    const newUser = new User({
      id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      username: userData.username,
      email: userData.email,
      passwordHash: await User.hashPassword(userData.password),
      isAdmin: false,
      preferences: {
        theme: 'blue',
        notifications: true,
        dataRetention: 90
      }
    });

    this.users.set(newUser.id, newUser);
    await this.saveUsers();

    return newUser;
  }

  async authenticateUser(username, password) {
    await this.initialize();

    const user = Array.from(this.users.values()).find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isValid = await User.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.saveUsers();

    return user;
  }

  async getUserById(id) {
    await this.initialize();
    return this.users.get(id);
  }

  async getUserByToken(token) {
    await this.initialize();

    for (const user of this.users.values()) {
      if (user.isValidToken(token)) {
        return user;
      }
    }

    return null;
  }

  async updateUser(id, updates) {
    await this.initialize();

    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Update allowed fields
    if (updates.username) user.username = updates.username;
    if (updates.email) user.email = updates.email;
    if (updates.avatar !== undefined) user.avatar = updates.avatar;
    if (updates.preferences) user.preferences = { ...user.preferences, ...updates.preferences };

    await this.saveUsers();
    return user;
  }

  async changePassword(id, currentPassword, newPassword) {
    await this.initialize();

    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await User.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    user.passwordHash = await User.hashPassword(newPassword);
    await this.saveUsers();
  }

  async deleteUser(id) {
    await this.initialize();

    if (!this.users.has(id)) {
      throw new Error('User not found');
    }

    this.users.delete(id);
    await this.saveUsers();
  }

  async getAllUsers() {
    await this.initialize();
    return Array.from(this.users.values());
  }

  async toggleUserAdmin(id) {
    await this.initialize();

    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.isAdmin = !user.isAdmin;
    await this.saveUsers();
    return user;
  }
}

module.exports = UserService;