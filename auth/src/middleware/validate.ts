import logger from "../config/logger.config"
import { Request, Response, NextFunction } from "express"
import { ZodTypeAny } from "zod"

export const validate =
  <T extends ZodTypeAny>(schema: T) =>
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = schema.parse({
          body: req.body,
          params: req.params,
          query: req.query,
        }) as any
        if (parsed.body) req.body = parsed.body
        if (parsed.params) req.params = parsed.params
        if (parsed.query) req.query = parsed.query
        next()
      } catch (error: any) {
        logger.error(`Validation error: ${JSON.stringify(error.errors)}`)
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        })
      }
    }
