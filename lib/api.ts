import type { CreateOrderRequest, Order } from "./types"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function createOrder(orderData: CreateOrderRequest): Promise<Order> {
  const response = await fetch("/api/mock/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(data.message || "Failed to create order", response.status, data.error)
  }

  return data
}

export async function getOrderStatus(orderId: string): Promise<Order> {
  const response = await fetch(`/api/mock/orders/${orderId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(data.message || "Failed to fetch order", response.status, data.error)
  }

  return data
}
