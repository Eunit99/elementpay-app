import { NextResponse } from "next/server"

// In-memory storage for pending webhook notifications
const pendingWebhooks: Array<{ order_id: string; status: string; timestamp: number }> = []

export async function GET() {
  try {
    // Return and clear pending webhooks
    const updates = [...pendingWebhooks]
    pendingWebhooks.length = 0

    return NextResponse.json(updates)
  } catch (error) {
    console.error("Error fetching webhook status:", error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { order_id, status } = await request.json()

    // Add to pending webhooks for frontend polling
    pendingWebhooks.push({
      order_id,
      status,
      timestamp: Date.now(),
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error storing webhook notification:", error)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
