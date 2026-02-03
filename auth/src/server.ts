import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "./config/logger.config";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import { errorHandler } from "./middleware/errorHandler";
import { defaultLimiter } from "./middleware/rateLimiter";

dotenv.config();

if (!process.env.ACCESS_TOKEN_SECRET || !process.env.INTERNAL_GATEWAY_SECRET || !process.env.INTERNAL_SERVICE_KEY || !process.env.DATABASE_URL) {
  console.error("CRITICAL: Missing required environment variables (AUTH_SERVICE)");
  process.exit(1);
}

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 4000; // Changed default PORT to 4000 to avoid common conflicts, but user had 3000

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Global Rate Limiter
app.use(defaultLimiter);

// Custom Logging Middleware (Standardized)
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "auth-service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/me/profile", profileRoutes);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (err: any) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

startServer();
