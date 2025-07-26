import { createServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message, source = "express") {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] [${source}] ${message}`);
}

export async function setupVite(app, server) {
  if (process.env.NODE_ENV === "production") {
    return serveStatic(app);
  }

  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
    root: resolve(__dirname, "../client"),
    resolve: {
      alias: {
        "@": resolve(__dirname, "../client/src"),
        "@shared": resolve(__dirname, "../shared"),
        "@assets": resolve(__dirname, "../attached_assets"),
      },
    },
    build: {
      outDir: resolve(__dirname, "../dist/public"),
      emptyOutDir: true,
    },
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  log("Vite middleware attached");
}

export function serveStatic(app) {
  import("express").then(({ static: expressStatic }) => {
    app.use(expressStatic(resolve(__dirname, "../dist/public")));
    app.get("*", (req, res) => {
      res.sendFile(resolve(__dirname, "../dist/public/index.html"));
    });
  });
  log("Static files served from dist/public");
}