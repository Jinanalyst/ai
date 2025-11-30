# Chatai - Earn SOL While You Chat

A Next.js web application where users can chat with an AI assistant and automatically earn Solana Testnet tokens for each message they send.

## Features

- 🔗 **Wallet Integration**: Connect with Phantom, Solflare, or Backpack wallets
- 💬 **AI Chat**: Chat with an AI assistant powered by Hugging Face
- 💰 **Token Rewards**: Earn CHAT token for each message you send
- 🎨 **Clean UI**: Modern, responsive design with TailwindCSS

## Tech Stack

- **Framework**: Next.js 14 + TypeScript
- **Styling**: TailwindCSS
- **Blockchain**: Solana Web3.js
- **Wallet**: Solana Wallet Adapter
- **AI**: Hugging Face Inference API

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Then edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
FAUCET_PRIVATE_KEY=your_devnet_private_key_here
```

### 3. Generate a Devnet Faucet Keypair

You need a Solana devnet wallet with some SOL to act as the faucet. You can:

**Option A: Use Solana CLI**
```bash
# Install Solana CLI if you haven't already
# Then generate a new keypair
solana-keygen new --outfile ./devnet-keypair.json

# Get devnet SOL from a faucet
solana airdrop 1 <your-public-key> --url https://api.devnet.solana.com

# Convert private key to base58 format
# The private key array from the JSON file needs to be converted
```

**Option B: Use an online tool**
- Generate a keypair using Solana's web tools
- Fund it with devnet SOL from https://faucet.solana.com
- Convert the private key array to base58 format

**Private Key Format:**
The `FAUCET_PRIVATE_KEY` can be in two formats:
1. Base58 encoded string (recommended)
2. JSON array format: `[1,2,3,...]` (from keypair JSON file)

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet**: Click "Connect Solana Wallet" and select your wallet (Phantom or Solflare)
2. **Switch to Devnet**: Make sure your wallet is connected to Solana Devnet
3. **Start Chatting**: Type a message and send it
4. **Earn Tokens**: You'll automatically receive 1 CHAT token for each message

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/          # AI chat API route
│   │   └── reward/        # Solana reward API route
│   ├── layout.tsx         # Root layout with wallet provider
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/
│   ├── WalletProvider.tsx # Solana wallet context provider
│   ├── WalletButton.tsx   # Wallet connection component
│   └── ChatInterface.tsx  # Chat UI component
└── ...
```

## API Routes

### `/api/chat`
Handles AI chat requests using Hugging Face Inference API.

**Request:**
```json
{
  "message": "Hello!",
  "history": []
}
```

**Response:**
```json
{
  "reply": "Hello! How can I help you?"
}
```

### `/api/reward`
Sends CHAT token rewards to user wallets.

**Request:**
```json
{
  "walletAddress": "user_wallet_address"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "transaction_signature",
  "amount": 1,
  "tokenMint": "GDTCMCQ8Zs5vnVPPDjSYciZJ67YcrCbnP31WGuUvL8Kj"
}
```

## Important Notes

- ⚠️ This app uses **Solana Devnet only** - no real money is involved
- 💧 Make sure your faucet wallet has enough SOL (minimum 0.01 SOL for transaction fees) and CHAT tokens (1 token per message)
- 🔒 Never commit your `.env.local` file or private keys to version control
- 🧪 This is a demo/MVP - production use would require additional security measures

## Troubleshooting

**Wallet won't connect:**
- Make sure you have a Solana wallet extension installed (Phantom or Solflare)
- Ensure your wallet is set to Devnet network

**Rewards not working:**
- Check that `FAUCET_PRIVATE_KEY` is correctly set in `.env.local`
- Verify the faucet wallet has sufficient SOL balance (minimum 0.01 SOL for transaction fees)
- Verify the faucet wallet has CHAT tokens to distribute (1 token per message)
- Check the browser console and server logs for errors

**AI not responding:**
- Verify `HUGGINGFACE_API_KEY` is set correctly in `.env.local`
- Check your Hugging Face API quota/limits
- The model may be loading (first request can take time)

## License

MIT
