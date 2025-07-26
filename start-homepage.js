const express = require('express');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// MongoDB setup
let mongoStorage = null;

async function connectMongoDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/";
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db("express_react_app");
    const users = db.collection("users");
    
    mongoStorage = {
      async getAllUsers() {
        return await users.find({}).toArray();
      },
      async getStats() {
        const count = await users.countDocuments();
        return { totalUsers: count };
      }
    };
    
    console.log('[MongoDB] Connected successfully');
    return true;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error.message);
    return false;
  }
}

// API Routes
app.get('/api/users', async (req, res) => {
  try {
    if (!mongoStorage) {
      return res.status(500).json({ message: 'Database not connected' });
    }
    const users = await mongoStorage.getAllUsers();
    res.json({ message: 'Success', data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/api/server-info', async (req, res) => {
  try {
    const stats = mongoStorage ? await mongoStorage.getStats() : { totalUsers: 0 };
    res.json({
      backend: { url: 'http://localhost:5000', status: 'running', version: '1.0.0' },
      frontend: { url: 'http://localhost:5000', framework: 'React.js' },
      database: { type: 'MongoDB', name: 'express_react_app', connected: !!mongoStorage, totalUsers: stats.totalUsers }
    });
  } catch (error) {
    console.error('Error getting server info:', error);
    res.status(500).json({ message: 'Error getting server info' });
  }
});

// Serve static files from public
app.use(express.static('public'));

// Start server
async function startServer() {
  await connectMongoDB();
  
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on port ${PORT}`);
    console.log(`[Frontend] Available at http://localhost:${PORT}`);
    console.log(`[API] Available at http://localhost:${PORT}/api`);
  });
}

startServer();
