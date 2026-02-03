import { Request, Response, NextFunction } from "express"

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role?: string }
    }
  }
}

export const requireGateway = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const gatewayToken = req.headers["x-internal-token"]
  const userId = req.headers["x-user-id"]
  const userRole = req.headers["x-user-role"]

  if (gatewayToken !== process.env.INTERNAL_GATEWAY_SECRET) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Direct access not allowed",
    })
  }

  if (!userId || typeof userId !== "string") {
    return res.status(401).json({
      success: false,
      message: "Missing user identity",
    })
  }

  req.user = {
    userId,
    role: typeof userRole === "string" ? userRole : undefined
  }
  next()
}
