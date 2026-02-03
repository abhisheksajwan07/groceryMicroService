import crypto from "crypto"

export const normalizePhone = (phone: string) => {
  if (!phone.startsWith("+")) return "+91" + phone
  return phone
}

export const hashValue = (value: string) => {
  return crypto.createHash("sha256").update(value).digest("hex")
}
