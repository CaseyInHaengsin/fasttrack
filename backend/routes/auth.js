const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const createAuthRoutes = (userService) => {
  const router = express.Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const user = await userService.createUser({ username, email, password });
      const token = user.generateSessionToken();
      await userService.saveUsers();

      res.json({
        user: user.toPublicJSON(),
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Login user
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await userService.authenticateUser(username, password);
      const token = user.generateSessionToken();
      await userService.saveUsers();

      res.json({
        user: user.toPublicJSON(),
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  });

  // Logout user
  router.post('/logout', authMiddleware(userService), async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader.substring(7);
      
      req.user.revokeToken(token);
      await userService.saveUsers();

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Verify token and get current user
  router.get('/me', authMiddleware(userService), (req, res) => {
    res.json({ user: req.user.toPublicJSON() });
  });

  // Update profile
  router.put('/profile', authMiddleware(userService), async (req, res) => {
    try {
      const updates = req.body;
      const updatedUser = await userService.updateUser(req.user.id, updates);
      res.json({ user: updatedUser.toPublicJSON() });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Change password
  router.put('/password', authMiddleware(userService), async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
      }

      await userService.changePassword(req.user.id, currentPassword, newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};

module.exports = createAuthRoutes;