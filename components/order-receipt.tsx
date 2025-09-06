"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, Plus, Copy } from "lucide-react"
import { useState } from "react"
import type { Order } from "@/lib/types"

interface OrderReceiptProps {
  order: Order
  onCreateNewOrder: () => void
}

export function OrderReceipt({ order, onCreateNewOrder }: OrderReceiptProps) {
  const [copied, setCopied] = useState(false)

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.order_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy order ID:", error)
    }
  }

  const isSuccess = order.status === "settled"
  const StatusIcon = isSuccess ? CheckCircle : XCircle

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <StatusIcon className={`h-12 w-12 ${isSuccess ? "text-green-500" : "text-red-500"}`} />
        </div>
        <CardTitle>{isSuccess ? "Payment Successful!" : "Payment Failed"}</CardTitle>
        <CardDescription>
          {isSuccess ? "Your order has been processed successfully" : "There was an issue processing your payment"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Badge variant={isSuccess ? "default" : "destructive"}>{order.status.toUpperCase()}</Badge>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{order.order_id}</span>
                <Button variant="ghost" size="sm" onClick={copyOrderId} className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-medium">
                {order.amount} {order.currency}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Token</span>
              <span className="font-medium">{order.token}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{new Date(order.created_at).toLocaleString()}</span>
            </div>

            {order.note && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Note</span>
                <p className="text-sm bg-muted p-2 rounded">{order.note}</p>
              </div>
            )}
          </div>
        </div>

        {copied && (
          <div className="text-center">
            <p className="text-sm text-green-600">Order ID copied to clipboard!</p>
          </div>
        )}

        <Button onClick={onCreateNewOrder} className="w-full" variant={isSuccess ? "default" : "outline"}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Order
        </Button>
      </CardContent>
    </Card>
  )
}
