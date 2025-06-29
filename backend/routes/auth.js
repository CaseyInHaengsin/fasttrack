const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const createAuthRoutes = (userService) => {
  const router = express.Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }
      
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }
      
      const user = await userService.register({ username, email, password });
      
      // Auto-login after registration
      const loginResult = await userService.login({ username, password });
      
      res.status(201).json({
        user: loginResult.user,
        token: loginResult.token,
        message: 'User registered and logged in successfully'
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
      
      const result = await userService.login({ username, password });
      res.json({
        user: result.user,
        token: result.token,
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  });

  // Logout user
  router.post('/logout', authMiddleware(userService), async (req, res) => {
    try {
      await userService.logout(req.token);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  // Logout all sessions for current user
  router.post('/logout-all', authMiddleware(userService), async (req, res) => {
    try {
      const loggedOutCount = await userService.logoutAllSessions(req.user.id);
      res.json({ 
        message: `Logged out from ${loggedOutCount} sessions`,
        count: loggedOutCount
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({ error: 'Failed to logout all sessions' });
    }
  });

  // Get current user profile
  router.get('/me', authMiddleware(userService), (req, res) => {
    res.json({ 
      user: req.user,
      message: 'Profile retrieved successfully'
    });
  });

  // Get active sessions for current user
  router.get('/sessions', authMiddleware(userService), async (req, res) => {
    try {
      const sessions = await userService.getActiveSessions(req.user.id);
      res.json(sessions);
    } catch (error) {
      console.error('Sessions fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  // Update user profile
  router.put('/profile', authMiddleware(userService), async (req, res) => {
    try {
      const updates = req.body;
      
      // Validate updates
      if (updates.username && updates.username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }
      
      if (updates.email && !updates.email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }
      
      const updatedUser = await userService.updateUser(req.user.id, updates);
      res.json({ 
        user: updatedUser,
        message: 'Profile updated successfully'
      });
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
        return res.status(400).json({ error: 'Current password and new password are required' });
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

  // Validate token
  router.get('/validate', authMiddleware(userService), (req, res) => {
    res.json({ 
      valid: true, 
      user: req.user,
      message: 'Token is valid'
    });
  });

  return router;
};

module.exports = createAuthRoutes;