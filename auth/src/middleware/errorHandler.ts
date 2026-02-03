import type { Request, Response, NextFunction } from "express"
import { ApiError } from "../utils/ApiError"
import { ZodError } from "zod"
import logger from "../config/logger.config"

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Always log
  logger.error(`${req.method} ${req.path} error: ${err.message || err}`)

  // Custom app errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    })
  }

  // Validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    })
  }

  // Fallback (unknown errors)
  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack || err : undefined,
  })
}
