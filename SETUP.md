# Chatai Setup Guide

This guide will help you configure and run your Chatai application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Your Merchant Wallet

Open `/app/checkout/page.tsx` and replace the placeholder wallet address with your actual Solana wallet address:

```typescript
const MERCHANT_WALLET = new PublicKey('YOUR_WALLET_ADDRESS_HERE');
```

Replace `'YOUR_WALLET_ADDRESS_HERE'` with your Solana wallet address (e.g., from Phantom or Solflare).

### 3. Adjust Payment Amount (Optional)

In the same file, you can customize the payment amount:

```typescript
const PAYMENT_AMOUNT = new BigNumber(0.01); // 0.01 SOL
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## 📁 Directory Structure

```
/app
├── page.tsx              # Landing page (/)
├── checkout/
│   └── page.tsx          # Solana Pay checkout (/checkout)
├── ai/
│   └── page.tsx          # AI chat interface (/ai)
├── api/
│   ├── chat/
│   │   └── route.ts      # AI chat API endpoint
│   └── reward/
│       └── route.ts      # Token reward API endpoint
└── layout.tsx            # Root layout with WalletProvider
```

## 🔄 User Flow

1. **Landing Page** (`/`) - Users see the hero section and click "Start Now"
2. **Checkout** (`/checkout`) - Users scan a Solana Pay QR code and complete payment
3. **AI Chat** (`/ai`) - After payment confirmation, users are redirected to the AI chat interface

## 🔧 Configuration Options

### Solana Network

By default, the app uses Solana mainnet. To change this, update the RPC endpoint in `/app/checkout/page.tsx`:

```typescript
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
```

For testing, you can use devnet:

```typescript
const SOLANA_RPC = 'https://api.devnet.solana.com';
```

### Payment Verification Interval

The app checks for payment confirmation every 2 seconds. To adjust this, modify the interval in `startPaymentMonitoring()`:

```typescript
}, 2000); // Check every 2 seconds
```

## 🎨 Customization

### Update Branding

1. Replace `/public/logo.svg` with your own logo
2. Update the app name in:
   - `/app/layout.tsx` (metadata)
   - `/app/page.tsx` (landing page)
   - `/app/checkout/page.tsx` (checkout page)
   - `/app/ai/page.tsx` (AI chat page)

### Styling

The app uses Tailwind CSS. Customize colors and styles by:

1. Editing the Tailwind classes in the component files
2. Modifying `/app/globals.css` for global styles
3. Updating the gradient backgrounds in each page

## 🔐 Security Notes

- **Never commit your private keys** to version control
- The merchant wallet address (public key) is safe to include in the code
- Consider implementing additional validation on the backend
- Use environment variables for sensitive configuration

## 📱 Testing Solana Pay

1. Download a Solana wallet app (Phantom, Solflare, etc.)
2. Ensure you have some SOL in your wallet
3. Navigate to `/checkout` in your browser
4. Use your wallet app to scan the QR code
5. Confirm the transaction
6. The app should automatically detect the payment and redirect to `/ai`

## 🐛 Troubleshooting

### QR Code Not Displaying

- Check that `@solana/pay` and `qrcode.react` are installed
- Verify the merchant wallet address is a valid Solana public key
- Check browser console for errors

### Payment Not Detected

- Ensure the transaction was confirmed on-chain
- Check the RPC endpoint is responding
- Verify the payment amount matches the expected amount
- Look for errors in the browser console

### Wallet Connection Issues on /ai

- Make sure you've connected your wallet on the AI chat page
- The WalletProvider is configured in the root layout
- Try refreshing the page

## 📦 Dependencies

Key packages used:

- `@solana/pay` - Solana Pay protocol
- `@solana/web3.js` - Solana blockchain interaction
- `@solana/wallet-adapter-react` - Wallet connection
- `bignumber.js` - Precise number handling
- `next` - React framework

## 🚢 Deployment

Before deploying to production:

1. Set your actual merchant wallet address
2. Configure proper RPC endpoints (consider using a dedicated RPC provider)
3. Test the complete flow on mainnet with small amounts
4. Set up proper error monitoring
5. Consider implementing a backend verification system

## 📞 Support

For issues or questions:

- Check the browser console for error messages
- Verify all dependencies are installed correctly
- Ensure your Solana wallet has sufficient balance
- Test on Solana devnet first before using mainnet

## 🎉 Next Steps

- Customize the landing page design
- Add more features to the AI chat
- Implement user accounts and payment history
- Add analytics to track conversions
- Enhance the checkout experience with more payment options
