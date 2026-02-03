import twilio from "twilio"
import dotenv from "dotenv"
import { ApiError } from "./ApiError"
dotenv.config()

const accountSid = process.env.TWILIO_ACCOUNT_SID!
const authToken = process.env.TWILIO_AUTH_TOKEN!
const twilioPhone = process.env.TWILIO_VIRTUAL_NUMBER!

const client = twilio(accountSid, authToken)

export async function sendOtp(to: string, otp: string): Promise<void> {
  try {
    const messages = await client.messages.create({
      body: `Your OTP code is ${otp}`,
      from: twilioPhone,
      to,
    })

    console.log(` OTP ${otp} sent to ${to} (SID: ${messages.sid})`)
  } catch (error: any) {
    console.error(" Twilio sendOtp Error:", {
      code: error.code,
      message: error.message,
    })
    throw new ApiError(500, "Failed to send OTP. Try again later.")
  }
}
