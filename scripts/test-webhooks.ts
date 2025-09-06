import { createHmac } from "crypto"

// Test webhook signature generation and verification
function generateWebhookSignature(payload: string, secret: string, timestamp: number): string {
  const data = `${timestamp}.${payload}`
  const signature = createHmac("sha256", secret).update(data).digest("base64")
  return `t=${timestamp},v1=${signature}`
}

function testWebhookSignatures() {
  const secret = "shh_super_secret"

  console.log("🧪 Testing Webhook Signatures\n")

  // Test case 1: Valid signature (from assessment)
  const validPayload = '{"type":"order.settled","data":{"order_id":"ord_0xabc123","status":"settled"}}'
  const validTimestamp = 1710000000
  const expectedSignature = "3QXTcQv0m0h4QkQ0L0w9ZsH1YFhZgMGnF0d9Xz4P7nQ="

  const generatedSignature = generateWebhookSignature(validPayload, secret, validTimestamp)
  console.log("✅ Valid Test Case:")
  console.log(`   Payload: ${validPayload}`)
  console.log(`   Timestamp: ${validTimestamp}`)
  console.log(`   Expected: t=${validTimestamp},v1=${expectedSignature}`)
  console.log(`   Generated: ${generatedSignature}`)
  console.log(`   Match: ${generatedSignature.includes(expectedSignature) ? "✅ YES" : "❌ NO"}\n`)

  // Test case 2: Invalid signature (from assessment)
  const invalidPayload = '{"type":"order.failed","data":{"order_id":"ord_0xabc123","status":"failed"}}'
  const invalidTimestamp = 1710000300
  const invalidSignature = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="

  const generatedInvalidSignature = generateWebhookSignature(invalidPayload, secret, invalidTimestamp)
  console.log("❌ Invalid Test Case:")
  console.log(`   Payload: ${invalidPayload}`)
  console.log(`   Timestamp: ${invalidTimestamp}`)
  console.log(`   Invalid Sig: t=${invalidTimestamp},v1=${invalidSignature}`)
  console.log(`   Correct Sig: ${generatedInvalidSignature}`)
  console.log(`   Should Fail: ${!generatedInvalidSignature.includes(invalidSignature) ? "✅ YES" : "❌ NO"}\n`)

  // Test case 3: Current timestamp
  const currentPayload = '{"type":"order.processing","data":{"order_id":"ord_0xtest123","status":"processing"}}'
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const currentSignature = generateWebhookSignature(currentPayload, secret, currentTimestamp)

  console.log("🕐 Current Time Test Case:")
  console.log(`   Payload: ${currentPayload}`)
  console.log(`   Timestamp: ${currentTimestamp}`)
  console.log(`   Signature: ${currentSignature}`)

  // Generate curl commands
  console.log("\n📋 Curl Commands for Testing:\n")

  console.log("Valid webhook (should return 200):")
  console.log(`curl -X POST http://localhost:3000/api/webhooks/elementpay \\`)
  console.log(`  -H 'Content-Type: application/json' \\`)
  console.log(`  -H 'X-Webhook-Signature: t=${validTimestamp},v1=${expectedSignature}' \\`)
  console.log(`  -d '${validPayload}'\n`)

  console.log("Invalid signature (should return 403):")
  console.log(`curl -X POST http://localhost:3000/api/webhooks/elementpay \\`)
  console.log(`  -H 'Content-Type: application/json' \\`)
  console.log(`  -H 'X-Webhook-Signature: t=${invalidTimestamp},v1=${invalidSignature}' \\`)
  console.log(`  -d '${invalidPayload}'\n`)

  console.log("Current timestamp (should return 200):")
  console.log(`curl -X POST http://localhost:3000/api/webhooks/elementpay \\`)
  console.log(`  -H 'Content-Type: application/json' \\`)
  console.log(`  -H 'X-Webhook-Signature: ${currentSignature}' \\`)
  console.log(`  -d '${currentPayload}'`)
}

// Run tests
testWebhookSignatures()
