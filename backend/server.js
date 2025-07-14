const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const UserService = require('./services/UserService');
const createAuthRoutes = require('./routes/auth');
const createAdminRoutes = require('./routes/admin');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = process.env.DATA_DIR || '/data/app_data';

// Initialize services
const userService = new UserService(DATA_DIR);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for avatar uploads

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

// Helper functions
const getUserDataPath = (userId, type) => path.join(DATA_DIR, `${userId}_${type}.json`);

const readUserData = async (userId, type) => {
  try {
    const filePath = getUserDataPath(userId, type);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeUserData = async (userId, type, data) => {
  const filePath = getUserDataPath(userId, type);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Authentication routes
app.use('/api/auth', createAuthRoutes(userService));

// Admin routes
app.use('/api/admin', createAdminRoutes(userService));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Protected routes (require authentication)
app.use('/api', authMiddleware(userService));

// Live timer endpoints
app.get('/api/timer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own timer (or admin can access any)
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const timer = await readUserData(userId, 'timer');
    res.json(timer.length > 0 ? timer[0] : null);
  } catch (error) {
    console.error('Error fetching timer:', error);
    res.status(500).json({ error: 'Failed to fetch timer data' });
  }
});

app.post('/api/timer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own timer
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { startTime, notes } = req.body;
    
    const timerData = {
      startTime,
      notes: notes || '',
      isPaused: false,
      pausedAt: null,
      createdAt: new Date().toISOString()
    };
    
    await writeUserData(userId, 'timer', [timerData]);
    res.json(timerData);
  } catch (error) {
    console.error('Error saving timer:', error);
    res.status(500).json({ error: 'Failed to save timer' });
  }
});

app.put('/api/timer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own timer
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { isPaused, pausedAt, notes } = req.body;
    
    const timer = await readUserData(userId, 'timer');
    if (timer.length === 0) {
      return res.status(404).json({ error: 'No active timer found' });
    }
    
    const updatedTimer = {
      ...timer[0],
      isPaused: isPaused !== undefined ? isPaused : timer[0].isPaused,
      pausedAt: pausedAt !== undefined ? pausedAt : timer[0].pausedAt,
      notes: notes !== undefined ? notes : timer[0].notes,
      updatedAt: new Date().toISOString()
    };
    
    await writeUserData(userId, 'timer', [updatedTimer]);
    res.json(updatedTimer);
  } catch (error) {
    console.error('Error updating timer:', error);
    res.status(500).json({ error: 'Failed to update timer' });
  }
});

app.delete('/api/timer/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own timer
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await writeUserData(userId, 'timer', []);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting timer:', error);
    res.status(500).json({ error: 'Failed to delete timer' });
  }
});

// Get user's fasting data
app.get('/api/fasts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own data (or admin can access any)
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const fasts = await readUserData(userId, 'fasts');
    res.json(fasts);
  } catch (error) {
    console.error('Error fetching fasts:', error);
    res.status(500).json({ error: 'Failed to fetch fasting data' });
  }
});

// Save a new fast
app.post('/api/fasts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { startTime, endTime, duration, notes } = req.body;
    
    const fasts = await readUserData(userId, 'fasts');
    const newFast = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      startTime,
      endTime,
      duration,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    fasts.push(newFast);
    await writeUserData(userId, 'fasts', fasts);
    
    res.json(newFast);
  } catch (error) {
    console.error('Error saving fast:', error);
    res.status(500).json({ error: 'Failed to save fast' });
  }
});

// Update a fast (for editing notes)
app.put('/api/fasts/:userId/:fastId', async (req, res) => {
  try {
    const { userId, fastId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { notes } = req.body;
    
    const fasts = await readUserData(userId, 'fasts');
    const fastIndex = fasts.findIndex(fast => fast.id === fastId);
    
    if (fastIndex === -1) {
      return res.status(404).json({ error: 'Fast not found' });
    }
    
    fasts[fastIndex] = {
      ...fasts[fastIndex],
      notes: notes || '',
      updatedAt: new Date().toISOString()
    };
    
    await writeUserData(userId, 'fasts', fasts);
    res.json(fasts[fastIndex]);
  } catch (error) {
    console.error('Error updating fast:', error);
    res.status(500).json({ error: 'Failed to update fast' });
  }
});

// Delete a fast
app.delete('/api/fasts/:userId/:fastId', async (req, res) => {
  try {
    const { userId, fastId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const fasts = await readUserData(userId, 'fasts');
    const updatedFasts = fasts.filter(fast => fast.id !== fastId);
    await writeUserData(userId, 'fasts', updatedFasts);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fast:', error);
    res.status(500).json({ error: 'Failed to delete fast' });
  }
});

// Get user's weight entries
app.get('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own data (or admin can access any)
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const weights = await readUserData(userId, 'weights');
    res.json(weights);
  } catch (error) {
    console.error('Error fetching weights:', error);
    res.status(500).json({ error: 'Failed to fetch weight data' });
  }
});

// Save weight entry
app.post('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { weight, bmi, unit } = req.body;
    
    const weights = await readUserData(userId, 'weights');
    const newWeight = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      weight,
      bmi,
      unit,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    weights.push(newWeight);
    weights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await writeUserData(userId, 'weights', weights);
    
    res.json(newWeight);
  } catch (error) {
    console.error('Error saving weight:', error);
    res.status(500).json({ error: 'Failed to save weight' });
  }
});

// Delete weight entry
app.delete('/api/weight/:userId/:weightId', async (req, res) => {
  try {
    const { userId, weightId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const weights = await readUserData(userId, 'weights');
    const updatedWeights = weights.filter(weight => weight.id !== weightId);
    await writeUserData(userId, 'weights', updatedWeights);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting weight:', error);
    res.status(500).json({ error: 'Failed to delete weight' });
  }
});

// Get user's supplements
app.get('/api/supplements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own data (or admin can access any)
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const supplements = await readUserData(userId, 'supplements');
    res.json(supplements);
  } catch (error) {
    console.error('Error fetching supplements:', error);
    res.status(500).json({ error: 'Failed to fetch supplement data' });
  }
});

// Save a new supplement
app.post('/api/supplements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, quantity, unit, time, notes } = req.body;
    
    const supplements = await readUserData(userId, 'supplements');
    const newSupplement = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name,
      quantity,
      unit,
      time,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    supplements.push(newSupplement);
    await writeUserData(userId, 'supplements', supplements);
    
    res.json(newSupplement);
  } catch (error) {
    console.error('Error saving supplement:', error);
    res.status(500).json({ error: 'Failed to save supplement' });
  }
});

// Delete a supplement
app.delete('/api/supplements/:userId/:supplementId', async (req, res) => {
  try {
    const { userId, supplementId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const supplements = await readUserData(userId, 'supplements');
    const updatedSupplements = supplements.filter(supplement => supplement.id !== supplementId);
    await writeUserData(userId, 'supplements', updatedSupplements);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplement:', error);
    res.status(500).json({ error: 'Failed to delete supplement' });
  }
});

// Get user's health profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own data (or admin can access any)
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const profile = await readUserData(userId, 'profile');
    res.json(profile.length > 0 ? profile[0] : null);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Save user's health profile
app.post('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const profileData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await writeUserData(userId, 'profile', [profileData]);
    res.json(profileData);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// Bulk import data
app.post('/api/import/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only modify their own data
    if (userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { fasts, weights, supplements, profile } = req.body;
    
    if (fasts && fasts.length > 0) {
      const existingFasts = await readUserData(userId, 'fasts');
      const allFasts = [...existingFasts, ...fasts];
      await writeUserData(userId, 'fasts', allFasts);
    }
    
    if (weights && weights.length > 0) {
      const existingWeights = await readUserData(userId, 'weights');
      const allWeights = [...existingWeights, ...weights];
      allWeights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      await writeUserData(userId, 'weights', allWeights);
    }
    
    if (supplements && supplements.length > 0) {
      const existingSupplements = await readUserData(userId, 'supplements');
      const allSupplements = [...existingSupplements, ...supplements];
      await writeUserData(userId, 'supplements', allSupplements);
    }
    
    if (profile) {
      await writeUserData(userId, 'profile', [profile]);
    }
    
    res.json({ success: true, message: 'Data imported successfully' });
  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ error: 'Failed to import data' });
  }
});

// Export all user data
app.get('/api/export/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own data (or admin can access any)
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const fasts = await readUserData(userId, 'fasts');
    const weights = await readUserData(userId, 'weights');
    const supplements = await readUserData(userId, 'supplements');
    const profile = await readUserData(userId, 'profile');
    
    res.json({
      fasts,
      weights,
      supplements,
      profile: profile.length > 0 ? profile[0] : null,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Initialize server
const startServer = async () => {
  await ensureDataDir();
  await userService.initialize();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FastTrack API Server running on port ${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Authentication enabled with persistent sessions`);
    console.log(`⏱️  Live timer persistence enabled`);
  });
};

startServer().catch(console.error);