const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.avatar = data.avatar;
    this.isAdmin = data.isAdmin || false;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.lastLogin = data.lastLogin ? new Date(data.lastLogin) : null;
    this.preferences = data.preferences || {
      theme: 'blue',
      notifications: true,
      dataRetention: 90
    };
    this.sessionTokens = data.sessionTokens || [];
  }

  static async hashPassword(password) {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(salt + ':' + derivedKey.toString('hex'));
      });
    });
  }

  static async verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
      const [salt, key] = hash.split(':');
      crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      });
    });
  }

  generateSessionToken() {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    this.sessionTokens.push({
      token,
      expiresAt,
      createdAt: new Date()
    });

    // Clean up expired tokens
    this.sessionTokens = this.sessionTokens.filter(
      session => session.expiresAt > new Date()
    );

    return token;
  }

  isValidToken(token) {
    const session = this.sessionTokens.find(s => s.token === token);
    return session && session.expiresAt > new Date();
  }

  revokeToken(token) {
    this.sessionTokens = this.sessionTokens.filter(s => s.token !== token);
  }

  revokeAllTokens() {
    this.sessionTokens = [];
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      passwordHash: this.passwordHash,
      avatar: this.avatar,
      isAdmin: this.isAdmin,
      createdAt: this.createdAt.toISOString(),
      lastLogin: this.lastLogin ? this.lastLogin.toISOString() : null,
      preferences: this.preferences,
      sessionTokens: this.sessionTokens.map(token => ({
        ...token,
        expiresAt: token.expiresAt.toISOString(),
        createdAt: token.createdAt.toISOString()
      }))
    };
  }

  toPublicJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
      isAdmin: this.isAdmin,
      createdAt: this.createdAt.toISOString(),
      lastLogin: this.lastLogin ? this.lastLogin.toISOString() : null,
      preferences: this.preferences
    };
  }
}

module.exports = User;