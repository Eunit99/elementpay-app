"use client"

// Webhook listener service for real-time order updates
class WebhookListenerService {
  private listeners = new Map<string, (status: string) => void>()
  private pollInterval: NodeJS.Timeout | null = null

  // Start listening for webhook updates for a specific order
  startListening(orderId: string, callback: (status: string) => void) {
    this.listeners.set(orderId, callback)

    // Start polling the webhook status endpoint if not already running
    if (!this.pollInterval) {
      this.startPolling()
    }
  }

  // Stop listening for a specific order
  stopListening(orderId: string) {
    this.listeners.delete(orderId)

    // Stop polling if no more listeners
    if (this.listeners.size === 0 && this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  // Poll for webhook updates (simulates real-time webhook delivery)
  private startPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        // Check for pending webhook notifications
        const response = await fetch("/api/webhooks/status")
        if (response.ok) {
          const updates = await response.json()

          // Process each update
          for (const update of updates) {
            const callback = this.listeners.get(update.order_id)
            if (callback) {
              callback(update.status)
            }
          }
        }
      } catch (error) {
        console.error("Webhook polling error:", error)
      }
    }, 2000) // Poll every 2 seconds for webhook updates
  }

  // Cleanup all listeners
  cleanup() {
    this.listeners.clear()
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }
}

export const webhookListener = new WebhookListenerService()
