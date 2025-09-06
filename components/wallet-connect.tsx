"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wallet, LogOut } from "lucide-react"

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>Connect your wallet to start creating orders</CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== "loading"
              const connected =
                ready && account && chain && (!authenticationStatus || authenticationStatus === "authenticated")

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <Button onClick={openConnectModal} className="w-full" size="lg">
                          Connect Wallet
                        </Button>
                      )
                    }

                    return null
                  })()}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connected
          </span>
          <Button variant="outline" size="sm" onClick={() => disconnect()} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
          <p className="font-mono text-sm bg-muted p-2 rounded break-all">{address}</p>
        </div>
        {chain && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Network</p>
            <Badge variant="secondary" className="font-mono">
              {chain.name}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
