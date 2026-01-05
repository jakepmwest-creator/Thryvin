import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupApiMiddleware, setupApiErrorHandlers, recentApiErrors, ApiRequest } from "./api-middleware";

const app = express();

// Git commit SHA for version tracking
const GIT_COMMIT = process.env.GIT_COMMIT || 'cb23b27';

// Trust proxy for secure cookies on Replit/Proxies
app.set("trust proxy", 1);

// CORS for iframe authentication with preflight on OPTIONS
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Bypass-Tunnel-Reminder"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// TEMP trace: see every v1 workout hit
app.use("/api/v1/workouts", (req, _res, next) => {
  console.log("XXX TRACE v1 ->", req.method, req.originalUrl);
  next();
});

// TEMP trace (fallback): non-v1 workouts
app.use("/api/workouts", (req, _res, next) => {
  console.log("XXX TRACE fallback ->", req.method, req.originalUrl);
  next();
});
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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Serve static files from public directory in development
    const path = await import("path");
    app.use(express.static(path.resolve(import.meta.dirname, "..", "public")));
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve on port 8001 for Kubernetes ingress routing
  // Kubernetes routes /api requests to port 8001
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8001;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
