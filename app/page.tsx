"use client"

import { WalletConnect } from "@/components/wallet-connect"
import { OrderForm } from "@/components/order-form"
import { useAccount } from "wagmi"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">ElementPay</h1>
          <p className="text-muted-foreground text-lg">Crypto Payment Gateway - Frontend Assessment</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="orders" disabled={!isConnected}>
                Orders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="mt-6">
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              {isConnected ? (
                <OrderForm />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Connect Wallet Required</CardTitle>
                    <CardDescription>Please connect your wallet to access the order form.</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
