const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const createAdminRoutes = (userService) => {
  const router = express.Router();

  // Apply auth and admin middleware to all routes
  router.use(authMiddleware(userService));
  router.use(adminMiddleware);

  // Get all users
  router.get('/users', async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.json(users.map(user => user.toPublicJSON()));
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Delete user
  router.delete('/users/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await userService.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Toggle user admin status
  router.put('/users/:userId/admin', async (req, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot modify your own admin status' });
      }

      const updatedUser = await userService.toggleUserAdmin(userId);
      res.json({ user: updatedUser.toPublicJSON() });
    } catch (error) {
      console.error('Toggle admin error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  return router;
};

module.exports = createAdminRoutes;