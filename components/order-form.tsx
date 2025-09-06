"use client"

import type React from "react"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard } from "lucide-react"
import type { CreateOrderRequest, Order } from "@/lib/types"
import { createOrder, ApiError } from "@/lib/api"
import { ProcessingModal } from "./processing-modal"
import { OrderReceipt } from "./order-receipt"

export function OrderForm() {
  const { isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [showProcessing, setShowProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [formData, setFormData] = useState<CreateOrderRequest>({
    amount: 0,
    currency: "",
    token: "",
    note: "",
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than 0"
    }

    if (!formData.currency) {
      newErrors.currency = "Currency is required"
    }

    if (!formData.token) {
      newErrors.token = "Token is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const order = await createOrder(formData)

      setCurrentOrder(order)
      setShowProcessing(true)
      setIsLoading(false)

      setFormData({ amount: 0, currency: "", token: "", note: "" })
    } catch (error) {
      console.error("Failed to create order:", error)

      if (error instanceof ApiError) {
        if (error.code === "invalid_amount") {
          setErrors({ amount: error.message })
        } else if (error.code === "missing_currency") {
          setErrors({ currency: error.message })
        } else if (error.code === "missing_token") {
          setErrors({ token: error.message })
        } else {
          setErrors({ general: error.message })
        }
      } else {
        setErrors({ general: "An unexpected error occurred. Please try again." })
      }

      setIsLoading(false)
    }
  }

  const handleOrderFinalized = (finalizedOrder: Order) => {
    setCurrentOrder(finalizedOrder)
    setShowProcessing(false)
    setOrderComplete(true)
  }

  const handleOrderTimeout = () => {
    setShowProcessing(false)
    setOrderComplete(false)
    setCurrentOrder(null)
  }

  const handleCreateNewOrder = () => {
    setOrderComplete(false)
    setCurrentOrder(null)
  }

  if (!isConnected) {
    return (
      <Alert>
        <AlertDescription>Please connect your wallet to access the order form.</AlertDescription>
      </Alert>
    )
  }

  if (orderComplete && currentOrder) {
    return <OrderReceipt order={currentOrder} onCreateNewOrder={handleCreateNewOrder} />
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Create Order
          </CardTitle>
          <CardDescription>Fill out the form below to create a new payment order</CardDescription>
        </CardHeader>
        <CardContent>
          {errors.general && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className={errors.amount ? "border-destructive" : ""}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className={errors.currency ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && <p className="text-sm text-destructive">{errors.currency}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Token *</Label>
              <Select
                value={formData.token}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, token: value }))}
              >
                <SelectTrigger className={errors.token ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
              {errors.token && <p className="text-sm text-destructive">{errors.token}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note for this order..."
                value={formData.note}
                onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Order...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {showProcessing && currentOrder && (
        <ProcessingModal order={currentOrder} onOrderFinalized={handleOrderFinalized} onTimeout={handleOrderTimeout} />
      )}
    </>
  )
}
