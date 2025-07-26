import { storage } from "./storage.js";

export function registerRoutes(app) {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json({
        message: "Success",
        data: users
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ 
          message: "Name and email are required" 
        });
      }

      const user = await storage.createUser({ name, email });
      res.status(201).json({
        message: "User created successfully",
        data: user
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
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

  // Server info endpoint
  app.get("/api/server-info", (req, res) => {
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
      config: {
        cors: true,
        errorHandling: true,
        logging: true,
        hotReload: process.env.NODE_ENV === "development"
      }
    });
  });

  // API endpoints info
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
        path: "/api/health",
        description: "Server health check"
      },
      {
        method: "GET",
        path: "/api/server-info",
        description: "Get server information"
      }
    ]);
  });
}
