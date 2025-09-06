import type { Order, OrderStatus } from "./types"

// In-memory storage for orders (as specified in assessment)
const orders = new Map<string, Order>()

export function generateOrderId(): string {
  return `ord_0x${Math.random().toString(16).substring(2, 10)}`
}

export function createOrder(orderData: Omit<Order, "order_id" | "status" | "created_at">): Order {
  const order: Order = {
    order_id: generateOrderId(),
    status: "created",
    created_at: new Date().toISOString(),
    ...orderData,
  }

  orders.set(order.order_id, order)
  return order
}

export function getOrder(orderId: string): Order | null {
  return orders.get(orderId) || null
}

export function getOrderWithTimeBasedStatus(orderId: string): Order | null {
  const order = orders.get(orderId)
  if (!order) return null

  // Calculate time elapsed since creation
  const createdAt = new Date(order.created_at).getTime()
  const now = Date.now()
  const elapsedSeconds = Math.floor((now - createdAt) / 1000)

  let status: OrderStatus
  if (elapsedSeconds <= 7) {
    status = "created"
  } else if (elapsedSeconds <= 17) {
    status = "processing"
  } else {
    // ≥18s → settled (80%) or failed (20%)
    status = Math.random() < 0.8 ? "settled" : "failed"
  }

  return {
    ...order,
    status,
  }
}

export function updateOrderStatus(orderId: string, status: OrderStatus): boolean {
  const order = orders.get(orderId)
  if (!order) return false

  orders.set(orderId, { ...order, status })
  return true
}
