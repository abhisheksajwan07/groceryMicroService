import express from "express"
import {
  sendOtpController,
  verifyOtpController,
  refreshTokenController,
  logoutController,
} from "../controller/auth.controller"
import { validate } from "../middleware/validate"
import {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../validations/auth.validations"
import { verifyRefreshToken } from "../middleware/authMiddleware"
// import { verifyRefreshToken } from "../utils/jwt"
import { defaultLimiter, otpLimiter, userLimiter } from "../middleware/rateLimiter"
import { requireGateway } from "../middleware/requireGateway"

const router = express.Router()

router.post("/send-otp", otpLimiter, validate(sendOtpSchema), sendOtpController)
router.post(
  "/verify-otp",
  otpLimiter,  // combined with redis attaempts = safe
  validate(verifyOtpSchema),
  verifyOtpController,
)

router.post(
  "/refresh-token",
  userLimiter,  // prevents token hammering
  validate(refreshTokenSchema),
  verifyRefreshToken,
  refreshTokenController,
)

router.post("/logout", requireGateway, defaultLimiter, validate(logoutSchema), logoutController)

export default router
