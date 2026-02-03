import express from "express";
import type { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import orderRoutes from "./routes/order.routes.js";
import { paymentWebhook } from "./controller/order.controller.js";
import { errorHandler } from "./middleware/errorHandler.js";
import logger from "./config/logger.config.js";
import { defaultLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

if (!process.env.INTERNAL_SERVICE_KEY || !process.env.INTERNAL_GATEWAY_SECRET || !process.env.PRODUCT_SERVICE_URL || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("CRITICAL: Missing required environment variables (ORDER_SERVICE)");
  process.exit(1);
}

const app = express();
const PORT = process.env.SERVER_PORT || process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());

// Global Rate Limiter
app.use(defaultLimiter);

// Custom Logging Middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Webhook (Specific Route before global body parsers)
app.post(
  "/api/order/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "order-service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/order", orderRoutes);

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
      logger.info(`✅ Order Service running on port: ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

startServer();
