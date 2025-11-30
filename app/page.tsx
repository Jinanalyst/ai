'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/WalletButton';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  const { connected } = useWallet();

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-light text-stone-800 mb-3">
            Welcome
          </h1>
          <p className="text-stone-500 text-sm">
            A simple space for conversation
          </p>
        </header>

        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8">
          {!connected && (
            <div className="mb-8 pb-8 border-b border-stone-100">
              <WalletButton />
            </div>
          )}

          {connected && (
            <div className="mb-8 pb-8 border-b border-stone-100">
              <WalletButton />
            </div>
          )}

          {connected ? (
            <ChatInterface />
          ) : (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center max-w-md">
                <p className="text-stone-400 text-sm leading-relaxed">
                  Connect your wallet to begin
                </p>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center">
          <p className="text-stone-400 text-xs">
            Made with care for humans
          </p>
        </footer>
      </div>
    </main>
  );
}

