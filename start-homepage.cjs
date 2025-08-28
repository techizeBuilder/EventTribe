const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

let mongoStorage = null;

async function connectMongoDB() {
  try {
    const mongoUri = "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/";
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db("express_react_app");
    const users = db.collection("users");
    
    mongoStorage = {
      async getAllUsers() { return await users.find({}).toArray(); },
      async getStats() { return { totalUsers: await users.countDocuments() }; }
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
    const users = await mongoStorage.getAllUsers();
    res.json({ message: 'Success', data: users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/api/server-info', async (req, res) => {
  try {
    const stats = await mongoStorage.getStats();
    res.json({
      backend: { url: 'http://localhost:5000', status: 'running', version: '1.0.0' },
      frontend: { url: 'http://localhost:5000', framework: 'React.js' },
      database: { type: 'MongoDB', connected: true, totalUsers: stats.totalUsers }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting server info' });
  }
});

// Serve the React app
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/homepage.html');
});
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/homepage.html');
});

async function startServer() {
  await connectMongoDB();
  app.listen(5000, '0.0.0.0', () => {
    console.log('[Server] Running on http://localhost:5000');
    console.log('[HomePage] Landing page ready');
  });
}

startServer();
