'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WalletButton from '@/components/WalletButton';
import ChatInterface from '@/components/ChatInterface';

export default function AIPage() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  if (!connected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to home page...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/logo.svg" alt="Chatai Logo" className="w-12 h-12" />
            <h1 className="text-4xl font-bold text-gray-900">Chatai</h1>
          </div>
          <p className="text-sm text-blue-600 font-semibold mb-1">chatai.helpeople.kr/ai</p>
          <p className="text-gray-600">Chat with AI and earn CHAT token</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <WalletButton />
          </div>

          <ChatInterface />
        </div>
      </div>
    </main>
  );
}
