"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, CheckCircle, XCircle, Wifi, WifiOff } from "lucide-react"
import { useOrderStatus } from "@/hooks/use-order-status"
import type { Order, OrderStatus } from "@/lib/types"

interface ProcessingModalProps {
  order: Order
  onOrderFinalized: (order: Order) => void
  onTimeout: () => void
}

export function ProcessingModal({ order, onOrderFinalized, onTimeout }: ProcessingModalProps) {
  const {
    order: currentOrder,
    isFinalized,
    timeElapsed,
    source,
    progress,
  } = useOrderStatus({
    orderId: order.order_id,
    onFinalized: onOrderFinalized,
    onTimeout,
    timeoutMs: 60000,
  })

  const displayOrder = currentOrder || order

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "created":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "settled":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "created":
        return "secondary"
      case "processing":
        return "default"
      case "settled":
        return "default"
      case "failed":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Processing Order
            {source && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {source === "webhook" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {source}
              </div>
            )}
          </DialogTitle>
          <DialogDescription>Order ID: {order.order_id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              {getStatusIcon(displayOrder.status)}
              <Badge variant={getStatusColor(displayOrder.status)}>{displayOrder.status.toUpperCase()}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {displayOrder.status === "created" && "Order created, waiting for processing..."}
                {displayOrder.status === "processing" && "Processing your payment..."}
                {displayOrder.status === "settled" && "Payment completed successfully!"}
                {displayOrder.status === "failed" && "Payment failed. Please try again."}
              </p>

              {!isFinalized && (
                <>
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{timeElapsed}s / 60s timeout</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">
                {order.amount} {order.currency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Token:</span>
              <span className="font-medium">{order.token}</span>
            </div>
            {order.note && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Note:</span>
                <span className="font-medium">{order.note}</span>
              </div>
            )}
          </div>

          {timeElapsed >= 60 && !isFinalized && (
            <div className="text-center">
              <p className="text-sm text-destructive mb-3">Timed out – try again</p>
              <Button onClick={onTimeout} variant="outline">
                Retry
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
