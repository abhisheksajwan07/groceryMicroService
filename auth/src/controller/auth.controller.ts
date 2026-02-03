import { prisma } from "../utils/prisma"
import { redisClient } from "../utils/redisClient"
import { sendOtp } from "../utils/twilio"
import { generateTokens } from "../utils/jwt"
import logger from "../config/logger.config"
import { Request, Response } from "express"
import generateOtp from "../utils/generateOtp"
import { ApiError } from "../utils/ApiError"
import { asyncHandler } from "../middleware/asyncHandler"

import { hashValue, normalizePhone } from "../utils/tools"


const OTP_TTL = 180
const MAX_ATTEMPTS = 5
const isProd = process.env.NODE_ENV === "production"

export const sendOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    let { phone } = req.body
    if (!phone) {
      throw new ApiError(400, "phone required")
    }
    phone = normalizePhone(phone)

    let user = await prisma.user.findUnique({
      where: { phone },
    })
    if (!user) {
      user = await prisma.user.create({
        data: { phone },
      })
    }

    const otp = generateOtp()
    const hashedOtp = hashValue(otp)
    await redisClient.set(`otp:${phone}`, hashedOtp, "EX", OTP_TTL)
    await redisClient.del(`otp_attempts:${phone}`)
    await sendOtp(phone, otp)

    return res.json({ success: true, message: "OTP sent successfully" })
  },
)

export const verifyOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    let { phone, otp } = req.body

    if (!phone || !otp) {
      throw new ApiError(400, "Phone and OTP required")
    }

    phone = normalizePhone(phone)

    const attemptsKey = `otp_attempts:${phone}`
    const attempts = Number((await redisClient.get(attemptsKey)) || 0)
    if (attempts >= MAX_ATTEMPTS) {
      throw new ApiError(429, "Too many attempts. Try later.")
    }
    const storedOtp = await redisClient.get(`otp:${phone}`)
    if (!storedOtp) {
      throw new ApiError(400, "OTP expired or not found")
    }

    if (storedOtp != hashValue(String(otp))) {
      await redisClient.incr(attemptsKey)
      await redisClient.expire(attemptsKey, OTP_TTL)
      throw new ApiError(400, "Invalid OTP")
    }

    const user = await prisma.user.findUnique({
      where: { phone },
    })
    if (!user) {
      throw new ApiError(404, "user not found")
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role)
    const hashedRefreshToken = hashValue(refreshToken)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    })

    await redisClient.del(`otp:${phone}`)
    await redisClient.del(attemptsKey)

    res.cookie("refreshToken", refreshToken, {
      sameSite: "strict",
      httpOnly: true,
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    return res.header({ Authorization: `Bearer ${accessToken}` }).json({
      success: true,
      accessToken,
      message: "OTP verified",
      user: { id: user.id, phone: user.phone },
    })
  },
)

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, role } = req.refreshAuth!
    if (!userId) {
      throw new ApiError(401, "Unauthorized: No user")
    }

    const oldToken = req.cookies?.refreshToken
    if (!oldToken) throw new ApiError(401, "Missing refresh token")
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.refreshToken) {
      throw new ApiError(404, "User not found")
    }

    if (user.refreshToken !== hashValue(oldToken)) {
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      })
      throw new ApiError(403, "Token reuse detected")
    }

    const { accessToken, refreshToken } = generateTokens(userId, role)

    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashValue(refreshToken) },
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.json({
      success: true,
      accessToken,
      message: "Access token refreshed",
    })
  },
)

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId
    logger.info(`User ${userId} - logoutController called`)

    if (!userId) {
      throw new ApiError(400, "userId required")
    }
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
    res.clearCookie("refreshToken")
    return res.json({ success: true, message: "Logged out successfully" })
  },
)
