'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/WalletButton';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const { connected } = useWallet();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.svg" alt="Chatai Logo" className="w-12 h-12" />
            <h1 className="text-4xl font-bold text-gray-900">Chatai</h1>
          </div>
          <p className="text-gray-600">Chat with AI and earn CHAT token</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {!connected && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <WalletButton />
            </div>
          )}

          {connected && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <WalletButton />
            </div>
          )}

          {connected ? (
            <ChatInterface />
          ) : (
            <div className="flex items-center justify-center h-[600px] text-gray-500">
              <div className="text-center">
                <p className="mb-4">Please connect your Solana wallet to start chatting and earning tokens</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

