const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const createAuthRoutes = (userService) => {
  const router = express.Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }
      
      const user = await userService.register({ username, email, password });
      res.status(201).json({ user, message: 'User registered successfully' });
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
      res.json(result);
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

  // Get current user profile
  router.get('/me', authMiddleware(userService), (req, res) => {
    res.json({ user: req.user });
  });

  // Update user profile
  router.put('/me', authMiddleware(userService), async (req, res) => {
    try {
      const updates = req.body;
      const updatedUser = await userService.updateUser(req.user.id, updates);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Validate token
  router.get('/validate', authMiddleware(userService), (req, res) => {
    res.json({ valid: true, user: req.user });
  });

  return router;
};

module.exports = createAuthRoutes;