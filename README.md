# ElementPay Frontend Assessment

A Next.js application demonstrating multi-wallet integration, order management, and real-time status updates with webhook support.

## Features

- **Multi-Wallet Support**: Connect/disconnect MetaMask, WalletConnect, and other popular wallets
- **Order Management**: Create orders with form validation and real-time status tracking
- **Real-time Updates**: Dual update system with polling (every 3s) and webhook notifications
- **Race Condition Handling**: First finalizer wins, prevents duplicate processing
- **Secure Webhooks**: HMAC SHA-256 signature verification with timing attack protection

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/eunit99/elementpay-app.git
cd elementpay-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your WalletConnect Project ID:

```env
WEBHOOK_SECRET=shh_super_secret
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Wallet Connection

1. Navigate to the **Wallet** tab
2. Click "Connect Wallet" to choose from available wallet providers
3. Approve the connection in your wallet
4. View connected wallet address and network information

### Creating Orders

1. Ensure your wallet is connected
2. Navigate to the **Orders** tab
3. Fill out the order form:
   - **Amount**: Must be greater than 0
   - **Currency**: Select from KES, USD, EUR
   - **Token**: Select from USDC, USDT, ETH, BTC
   - **Note**: Optional description
4. Click "Create Order"
5. Monitor real-time status updates in the processing modal

### Order Status Flow

- **Created** (0-7s): Order initialized
- **Processing** (8-17s): Payment being processed
- **Settled** (≥18s, 80% chance): Payment successful
- **Failed** (≥18s, 20% chance): Payment failed

## API Endpoints

### Order Management

#### Create Order

```http
POST /api/mock/orders/create
Content-Type: application/json

{
  "amount": 1500,
  "currency": "KES",
  "token": "USDC",
  "note": "optional"
}
```

#### Get Order Status

```http
GET /api/mock/orders/{order_id}
```

### Webhook Endpoint

#### Process Webhook

```http
POST /api/webhooks/elementpay
Content-Type: application/json
X-Webhook-Signature: t=<timestamp>,v1=<signature>

{
  "type": "order.settled",
  "data": {
    "order_id": "ord_0xabc123",
    "status": "settled"
  }
}
```

## Webhook Testing

### Test Vectors

The webhook endpoint uses HMAC SHA-256 verification. Test with these examples:

#### Valid Webhook (should return 200)

```bash
curl -X POST http://localhost:3000/api/webhooks/elementpay \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Signature: t=1710000000,v1=3QXTcQv0m0h4QkQ0L0w9ZsH1YFhZgMGnF0d9Xz4P7nQ=' \
  -d '{"type":"order.settled","data":{"order_id":"ord_0xabc123","status":"settled"}}'
```

#### Invalid Signature (should return 403)

```bash
curl -X POST http://localhost:3000/api/webhooks/elementpay \
  -H 'Content-Type: application/json' \
  -H 'X-Webhook-Signature: t=1710000300,v1=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' \
  -d '{"type":"order.failed","data":{"order_id":"ord_0xabc123","status":"failed"}}'
```

#### Missing Signature (should return 401)

```bash
curl -X POST http://localhost:3000/api/webhooks/elementpay \
  -H 'Content-Type: application/json' \
  -d '{"type":"order.processing","data":{"order_id":"ord_0xabc123","status":"processing"}}'
```

### Webhook Verification

The webhook signature verification follows this process:

1. **Parse signature header**: Extract timestamp `t` and signature `v1`
2. **Check freshness**: Reject if `|now - t| > 300s`
3. **Compute HMAC**: `base64(HMAC_SHA256(SECRET, "{t}.{raw_body}"))`
4. **Constant-time comparison**: Compare computed signature with provided `v1`

## Architecture

### Frontend Architecture

```txt
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── mock/          # Mock order endpoints
│   │   └── webhooks/      # Webhook handlers
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main application page
│   └── providers.tsx      # Wagmi & RainbowKit setup
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── wallet-connect.tsx # Wallet connection UI
│   ├── order-form.tsx    # Order creation form
│   ├── processing-modal.tsx # Status tracking modal
│   └── order-receipt.tsx # Final order receipt
├── hooks/                # Custom React hooks
│   └── use-order-status.ts # Order polling & webhook logic
└── lib/                  # Utilities and services
    ├── api.ts            # API client functions
    ├── orders.ts         # In-memory order storage
    ├── types.ts          # TypeScript definitions
    ├── wagmi.ts          # Wallet configuration
    ├── webhook-listener.ts # Webhook event handling
    └── webhook-verification.ts # HMAC verification
```

### Key Design Decisions

1. **In-Memory Storage**: Orders stored in memory as specified (no database required)
2. **Race Condition Handling**: Custom hook manages polling vs webhook updates
3. **Wallet Integration**: RainbowKit provides multi-wallet support out of the box
4. **Real-time Updates**: Hybrid approach with 3s polling + webhook notifications
5. **Security**: Constant-time HMAC comparison prevents timing attacks

### State Management

- **Wallet State**: Managed by wagmi hooks
- **Order State**: Local component state with custom hooks
- **Real-time Updates**: Event-driven architecture with cleanup on finalization

### Error Handling

- **API Errors**: Typed error responses with user-friendly messages
- **Webhook Verification**: Detailed error codes for debugging
- **Network Issues**: Graceful degradation with retry mechanisms
- **Timeout Handling**: 60-second timeout with retry option

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WEBHOOK_SECRET` | HMAC secret for webhook verification | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Yes |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing Webhooks Locally

1. Start the development server: `npm run dev`
2. Use the provided curl commands to test webhook verification
3. Monitor console logs for webhook processing details
4. Create an order in the UI and test real-time updates

## Assumptions

1. **Wallet Connection**: Users have MetaMask or WalletConnect-compatible wallets installed
2. **Network**: Application works on any EVM-compatible network
3. **Webhook Delivery**: In production, webhooks would be delivered by external payment processor
4. **Order Persistence**: Orders only need to persist during application runtime
5. **Security**: WEBHOOK_SECRET is securely managed in production environment

## Production Considerations

- Replace in-memory storage with persistent database
- Implement proper webhook retry mechanisms
- Add comprehensive error monitoring and logging
- Set up proper environment variable management
- Implement rate limiting for API endpoints
- Add comprehensive test suite
- Set up CI/CD pipeline for automated deployments

## License

This project is created for assessment purposes.
