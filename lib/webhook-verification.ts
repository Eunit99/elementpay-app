import { createHmac, timingSafeEqual } from "crypto"

export interface WebhookSignature {
  timestamp: number
  signature: string
}

export function parseWebhookSignature(signatureHeader: string): WebhookSignature | null {
  try {
    const parts = signatureHeader.split(",")
    let timestamp: number | undefined
    let signature: string | undefined

    for (const part of parts) {
      const [key, value] = part.split("=", 2)
      if (key === "t") {
        timestamp = Number.parseInt(value, 10)
      } else if (key === "v1") {
        signature = value
      }
    }

    if (timestamp === undefined || !signature) {
      return null
    }

    return { timestamp, signature }
  } catch {
    return null
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): { valid: boolean; error?: string } {
  const parsed = parseWebhookSignature(signatureHeader)
  if (!parsed) {
    return { valid: false, error: "Invalid signature format" }
  }

  const { timestamp, signature } = parsed

  // Check freshness (reject if |now - t| > 300s)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > 300) {
    return { valid: false, error: "Signature expired" }
  }

  // Compute HMAC: base64(HMAC_SHA256(SECRET, "{t}.{raw_body}"))
  const payload = `${timestamp}.${rawBody}`
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64")

  // Constant-time comparison
  const signatureBuffer = Buffer.from(signature, "base64")
  const expectedBuffer = Buffer.from(expectedSignature, "base64")

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: "Invalid signature" }
  }

  const isValid = timingSafeEqual(signatureBuffer, expectedBuffer)
  return { valid: isValid, error: isValid ? undefined : "Invalid signature" }
}
