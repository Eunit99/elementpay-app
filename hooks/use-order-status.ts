"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { getOrderStatus } from "@/lib/api"
import { webhookListener } from "@/lib/webhook-listener"
import type { Order, OrderStatus } from "@/lib/types"

interface UseOrderStatusOptions {
  orderId: string
  onFinalized?: (order: Order) => void
  onTimeout?: () => void
  timeoutMs?: number
}

export function useOrderStatus({ orderId, onFinalized, onTimeout, timeoutMs = 60000 }: UseOrderStatusOptions) {
  const [order, setOrder] = useState<Order | null>(null)
  const [isFinalized, setIsFinalized] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [source, setSource] = useState<"polling" | "webhook" | null>(null)

  const pollingIntervalRef = useRef<NodeJS.Timeout>()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const timerIntervalRef = useRef<NodeJS.Timeout>()
  const finalizedRef = useRef(false)

  // Finalize order with race condition protection
  const finalizeOrder = useCallback(
    (updatedOrder: Order, updateSource: "polling" | "webhook") => {
      if (finalizedRef.current) {
        console.log(`Order ${orderId} already finalized, ignoring ${updateSource} update`)
        return
      }

      console.log(`Order ${orderId} finalized via ${updateSource}:`, updatedOrder.status)

      finalizedRef.current = true
      setIsFinalized(true)
      setOrder(updatedOrder)
      setSource(updateSource)

      // Clear all intervals and timeouts
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

      // Stop webhook listener
      webhookListener.stopListening(orderId)

      // Notify parent component
      if (onFinalized) {
        setTimeout(() => onFinalized(updatedOrder), 1500)
      }
    },
    [orderId, onFinalized],
  )

  // Polling function
  const pollOrderStatus = useCallback(async () => {
    if (finalizedRef.current) return

    try {
      const updatedOrder = await getOrderStatus(orderId)
      setOrder(updatedOrder)

      // Check if order reached final state via polling
      if (updatedOrder.status === "settled" || updatedOrder.status === "failed") {
        finalizeOrder(updatedOrder, "polling")
      }
    } catch (error) {
      console.error("Failed to poll order status:", error)
    }
  }, [orderId, finalizeOrder])

  // Webhook callback
  const handleWebhookUpdate = useCallback(
    (status: OrderStatus) => {
      if (finalizedRef.current) return

      const updatedOrder = order ? { ...order, status } : null
      if (updatedOrder && (status === "settled" || status === "failed")) {
        finalizeOrder(updatedOrder, "webhook")
      } else if (updatedOrder) {
        setOrder(updatedOrder)
      }
    },
    [order, finalizeOrder],
  )

  // Setup polling and webhook listening
  useEffect(() => {
    // Start polling immediately, then every 3 seconds
    pollOrderStatus()
    pollingIntervalRef.current = setInterval(pollOrderStatus, 3000)

    // Start webhook listener
    webhookListener.startListening(orderId, handleWebhookUpdate)

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      webhookListener.stopListening(orderId)
    }
  }, [orderId, pollOrderStatus, handleWebhookUpdate])

  // Setup timer and timeout
  useEffect(() => {
    const startTime = Date.now()

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setTimeElapsed(elapsed)
    }

    updateTimer()
    timerIntervalRef.current = setInterval(updateTimer, 1000)

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (!finalizedRef.current) {
        console.log(`Order ${orderId} timed out after ${timeoutMs}ms`)

        finalizedRef.current = true
        setIsFinalized(true)

        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

        webhookListener.stopListening(orderId)

        if (onTimeout) onTimeout()
      }
    }, timeoutMs)

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [orderId, timeoutMs, onTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      webhookListener.cleanup()
    }
  }, [])

  return {
    order,
    isFinalized,
    timeElapsed,
    source,
    progress: Math.min((timeElapsed / (timeoutMs / 1000)) * 100, 100),
  }
}
