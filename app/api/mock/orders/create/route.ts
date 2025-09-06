import { type NextRequest, NextResponse } from "next/server"
import { createOrder } from "@/lib/orders"
import type { CreateOrderRequest } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: "invalid_amount", message: "Amount must be greater than 0" }, { status: 400 })
    }

    if (!body.currency) {
      return NextResponse.json({ error: "missing_currency", message: "Currency is required" }, { status: 400 })
    }

    if (!body.token) {
      return NextResponse.json({ error: "missing_token", message: "Token is required" }, { status: 400 })
    }

    // Create the order
    const order = createOrder({
      amount: body.amount,
      currency: body.currency,
      token: body.token,
      note: body.note,
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "internal_error", message: "Failed to create order" }, { status: 500 })
  }
}
