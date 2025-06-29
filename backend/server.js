const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = '/data';

// Middleware
app.use(cors());
app.use(express.json());

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

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get user's fasting data
app.get('/api/fasts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
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
    const { startTime, endTime, duration } = req.body;
    
    const fasts = await readUserData(userId, 'fasts');
    const newFast = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      startTime,
      endTime,
      duration,
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

// Delete a fast
app.delete('/api/fasts/:userId/:fastId', async (req, res) => {
  try {
    const { userId, fastId } = req.params;
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
    const weights = await readUserData(userId, 'weights');
    const updatedWeights = weights.filter(weight => weight.id !== weightId);
    await writeUserData(userId, 'weights', updatedWeights);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting weight:', error);
    res.status(500).json({ error: 'Failed to delete weight' });
  }
});

// Get user's health profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
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
    const { fasts, weights, profile } = req.body;
    
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
    const fasts = await readUserData(userId, 'fasts');
    const weights = await readUserData(userId, 'weights');
    const profile = await readUserData(userId, 'profile');
    
    res.json({
      fasts,
      weights,
      profile: profile.length > 0 ? profile[0] : null,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// List all users (for admin purposes)
app.get('/api/users', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const users = [...new Set(files.map(file => file.split('_')[0]))];
    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// Initialize server
const startServer = async () => {
  await ensureDataDir();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FastTrack API Server running on port ${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch(console.error);