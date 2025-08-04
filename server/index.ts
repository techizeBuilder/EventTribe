import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerEnhancedRoutes } from "./routesEnhanced";
import organizerRoutes from './routes/organizerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from "./routes/notificationRoutes.js";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Establish database connection once at startup
  const { mongoStorage } = await import('./mongodb-storage.js');
  console.log('[STARTUP] Connecting to MongoDB...');
  await mongoStorage.connect();
  console.log('[STARTUP] MongoDB connection established');

  const server = await registerEnhancedRoutes(app);
  // Register organizer routes
  app.use('/api/organizer', organizerRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle specific error types with user-friendly messages
    if (err.type === 'entity.too.large') {
      message = "File size too large. Please use an image smaller than 50MB or compress your image before uploading.";
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      message = "File size limit exceeded. Maximum allowed size is 50MB.";
    }

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT) || 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();