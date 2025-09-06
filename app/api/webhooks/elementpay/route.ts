import { type NextRequest, NextResponse } from "next/server"
import { verifyWebhookSignature } from "@/lib/webhook-verification"
import { updateOrderStatus } from "@/lib/orders"
import type { WebhookPayload } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for HMAC verification
    const rawBody = await request.text()
    const signatureHeader = request.headers.get("X-Webhook-Signature")

    if (!signatureHeader) {
      return NextResponse.json(
        { error: "missing_signature", message: "X-Webhook-Signature header is required" },
        { status: 401 },
      )
    }

    // Get webhook secret from environment
    const secret = process.env.WEBHOOK_SECRET
    if (!secret) {
      console.error("WEBHOOK_SECRET environment variable is not set")
      return NextResponse.json(
        { error: "server_error", message: "Webhook verification not configured" },
        { status: 500 },
      )
    }

    // Verify the webhook signature
    const verification = verifyWebhookSignature(rawBody, signatureHeader, secret)
    if (!verification.valid) {
      return NextResponse.json(
        { error: "invalid_signature", message: verification.error || "Invalid signature" },
        { status: 403 },
      )
    }

    // Parse the webhook payload
    let payload: WebhookPayload
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: "invalid_payload", message: "Invalid JSON payload" }, { status: 400 })
    }

    // Process the webhook based on type
    if (payload.type === "order.settled" || payload.type === "order.failed") {
      const { order_id, status } = payload.data

      if (!order_id || !status) {
        return NextResponse.json(
          { error: "invalid_payload", message: "Missing order_id or status in payload" },
          { status: 400 },
        )
      }

      // Update the order status
      const updated = updateOrderStatus(order_id, status)
      if (!updated) {
        return NextResponse.json({ error: "order_not_found", message: `No order with id ${order_id}` }, { status: 404 })
      }

      try {
        await fetch(`${request.nextUrl.origin}/api/webhooks/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id, status }),
        })
      } catch (error) {
        console.error("Failed to notify frontend:", error)
      }

      console.log(`Webhook processed: ${payload.type} for order ${order_id}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json({ error: "internal_error", message: "Failed to process webhook" }, { status: 500 })
  }
}
