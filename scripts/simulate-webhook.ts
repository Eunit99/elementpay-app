// Simulate webhook delivery for testing real-time updates
async function simulateWebhook(orderId: string, status: "settled" | "failed", delay = 0) {
  console.log(`🚀 Simulating webhook for order ${orderId} with status ${status} in ${delay}ms`)

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  const payload = {
    type: `order.${status}`,
    data: {
      order_id: orderId,
      status: status,
    },
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const secret = "shh_super_secret"
  const payloadString = JSON.stringify(payload)

  // Generate signature
  const crypto = require("crypto")
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${payloadString}`).digest("base64")

  try {
    const response = await fetch("http://localhost:3000/api/webhooks/elementpay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `t=${timestamp},v1=${signature}`,
      },
      body: payloadString,
    })

    const result = await response.json()
    console.log(`✅ Webhook delivered: ${response.status}`, result)
  } catch (error) {
    console.error("❌ Webhook delivery failed:", error)
  }
}

// Example usage:
// simulateWebhook("ord_0xabc123", "settled", 5000) // Deliver after 5 seconds
// simulateWebhook("ord_0xdef456", "failed", 10000) // Deliver after 10 seconds

export { simulateWebhook }
