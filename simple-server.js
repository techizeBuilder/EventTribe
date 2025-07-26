import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { mongoStorage } from "./server/mongodb-storage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Set MongoDB URI
process.env.MONGODB_URI = "mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/";

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await mongoStorage.getAllUsers();
    res.json({
      message: "Success",
      data: users
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        message: "Name and email are required" 
      });
    }

    // Check if user already exists
    const existingUser = await mongoStorage.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
    }

    const user = await mongoStorage.createUser({ name, email });
    res.status(201).json({
      message: "User created successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await mongoStorage.getUser(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      message: "Success",
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        message: "Name and email are required" 
      });
    }

    const user = await mongoStorage.updateUser(id, { name, email });
    res.json({
      message: "User updated successfully",
      data: user
    });
  } catch (error) {
    if (error.message === "User not found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await mongoStorage.deleteUser(id);
    
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/server-info", async (req, res) => {
  try {
    const dbStats = await mongoStorage.getStats();
    res.json({
      backend: {
        url: `http://localhost:${process.env.PORT || 5000}`,
        status: "running",
        version: "1.0.0"
      },
      frontend: {
        url: `http://localhost:${process.env.PORT || 5000}`,
        framework: "React.js"
      },
      database: {
        type: "MongoDB",
        name: dbStats.databaseName,
        connected: dbStats.isConnected,
        totalUsers: dbStats.totalUsers
      },
      config: {
        cors: true,
        errorHandling: true,
        logging: true,
        hotReload: process.env.NODE_ENV === "development"
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/endpoints", (req, res) => {
  res.json([
    {
      method: "GET",
      path: "/api/users",
      description: "Get all users"
    },
    {
      method: "POST",
      path: "/api/users", 
      description: "Create new user"
    },
    {
      method: "GET",
      path: "/api/users/:id",
      description: "Get user by ID"
    },
    {
      method: "PUT",
      path: "/api/users/:id",
      description: "Update user by ID"
    },
    {
      method: "DELETE",
      path: "/api/users/:id",
      description: "Delete user by ID"
    },
    {
      method: "GET",
      path: "/api/health",
      description: "Server health check"
    },
    {
      method: "GET",
      path: "/api/server-info",
      description: "Get server and database information"
    }
  ]);
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Initialize MongoDB connection and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoStorage.connect();
    
    const port = process.env.PORT || 5000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`[${new Date().toLocaleTimeString()}] Express.js server running on port ${port}`);
      console.log(`[${new Date().toLocaleTimeString()}] Frontend available at http://localhost:${port}`);
      console.log(`[${new Date().toLocaleTimeString()}] API endpoints available at http://localhost:${port}/api`);
      console.log(`[${new Date().toLocaleTimeString()}] MongoDB connected and ready`);
    });
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] Failed to start server:`, error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(`[${new Date().toLocaleTimeString()}] Shutting down server...`);
  await mongoStorage.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(`[${new Date().toLocaleTimeString()}] Shutting down server...`);
  await mongoStorage.disconnect();
  process.exit(0);
});

// Start the server
startServer();