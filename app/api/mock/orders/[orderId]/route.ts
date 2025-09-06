import { type NextRequest, NextResponse } from "next/server"
import { getOrderWithTimeBasedStatus } from "@/lib/orders"

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const { orderId } = params

    const order = getOrderWithTimeBasedStatus(orderId)

    if (!order) {
      return NextResponse.json(
        {
          error: "order_not_found",
          message: `No order with id ${orderId}`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json({ error: "internal_error", message: "Failed to fetch order" }, { status: 500 })
  }
}
