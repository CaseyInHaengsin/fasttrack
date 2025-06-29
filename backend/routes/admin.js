const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const createAdminRoutes = (userService) => {
  const router = express.Router();

  // Apply auth middleware to all admin routes
  router.use(authMiddleware(userService));
  router.use(adminMiddleware);

  // Get all users
  router.get('/users', async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Get user statistics
  router.get('/stats', async (req, res) => {
    try {
      const stats = await userService.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // Delete user
  router.delete('/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      const deleted = await userService.deleteUser(userId);
      if (deleted) {
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Toggle user admin status
  router.put('/users/:userId/admin', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent admin from modifying their own admin status
      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot modify your own admin status' });
      }
      
      const updatedUser = await userService.toggleUserAdmin(userId);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Error updating user admin status:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Update user (admin can update any user)
  router.put('/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const updatedUser = await userService.updateUser(userId, updates);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};

module.exports = createAdminRoutes;