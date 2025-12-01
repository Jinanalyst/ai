'use client';

import Link from 'next/link';
import { SolanaPayGateway } from '@/components/SolanaPayGateway';

export default function SolanaPayPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Navigation Bar */}
      <nav className="bg-black bg-opacity-30 backdrop-blur-md border-b border-white border-opacity-10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <img src="/logo.svg" alt="Chatai" className="w-8 h-8" />
            <span className="text-white font-bold">Chatai</span>
          </Link>
          <Link
            href="/"
            className="text-gray-200 hover:text-white transition font-medium"
          >
            Back to Chat
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="text-6xl mb-4">💰</div>
            <h1 className="text-5xl font-bold text-white mb-2">Solana Pay Gateway</h1>
            <p className="text-xl text-gray-300">Unlock Premium Features & Earn CHAT Tokens</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-xl p-6 hover:bg-opacity-20 transition">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2">Chat with Advanced AI</h3>
            <p className="text-gray-300 text-sm">
              Access our powerful AI assistant powered by state-of-the-art language models for intelligent conversations.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-xl p-6 hover:bg-opacity-20 transition">
            <div className="text-3xl mb-3">🎁</div>
            <h3 className="text-xl font-bold text-white mb-2">Earn CHAT Tokens</h3>
            <p className="text-gray-300 text-sm">
              Every message you send earns you CHAT tokens as rewards. The more you chat, the more you earn!
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-xl p-6 hover:bg-opacity-20 transition">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Transactions</h3>
            <p className="text-gray-300 text-sm">
              Fast, secure payments on Solana mainnet. Pay with 0.3 SOL to unlock premium benefits and start earning.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-xl p-6 hover:bg-opacity-20 transition">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Secure & Decentralized</h3>
            <p className="text-gray-300 text-sm">
              Built on Solana blockchain. Your transactions are secure, transparent, and under your complete control.
            </p>
          </div>
        </div>

        {/* Payment Gateway */}
        <div className="mb-12">
          <SolanaPayGateway />
        </div>

        {/* How It Works Section */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md border border-white border-opacity-20 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-white mb-6">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Make a Payment</h3>
                <p className="text-gray-300">Pay 0.3 SOL using the payment gateway above. You can either scan the QR code or send directly from your wallet.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Unlock Premium Access</h3>
                <p className="text-gray-300">Once payment is confirmed, your account gets upgraded to premium with access to advanced AI features.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Start Earning Tokens</h3>
                <p className="text-gray-300">Begin chatting with AI and earn CHAT tokens for every message. Your token balance grows with each interaction.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 text-white font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Trade or Use Tokens</h3>
                <p className="text-gray-300">Use your earned CHAT tokens for premium features, trade them on DEXs, or hold for future value appreciation.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          <div className="bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-300 mb-1">0.3</div>
            <div className="text-sm text-gray-300">SOL Payment</div>
          </div>
          <div className="bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-300 mb-1">Mainnet</div>
            <div className="text-sm text-gray-300">Solana Network</div>
          </div>
          <div className="bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-300 mb-1">Instant</div>
            <div className="text-sm text-gray-300">Token Rewards</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center border-t border-white border-opacity-20 pt-8">
          <p className="text-gray-400 mb-4">
            Questions? Check out our documentation or reach out to our support team.
          </p>
          <div className="flex justify-center gap-4">
            <a href="/" className="text-indigo-400 hover:text-indigo-300 transition">
              Back to Chat
            </a>
            <span className="text-gray-600">•</span>
            <a href="#" className="text-indigo-400 hover:text-indigo-300 transition">
              Documentation
            </a>
            <span className="text-gray-600">•</span>
            <a href="#" className="text-indigo-400 hover:text-indigo-300 transition">
              Support
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
