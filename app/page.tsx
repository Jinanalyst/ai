'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import WalletButton from '@/components/WalletButton';
import ChatInterface from '@/components/ChatInterface';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  const { connected, publicKey } = useWallet();
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => Date.now().toString());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewChat = () => {
    setCurrentSessionId(Date.now().toString());
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleSessionUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {connected && (
        <Sidebar
          walletAddress={publicKey?.toString() || null}
          currentSessionId={currentSessionId}
          onSessionSelect={handleSessionSelect}
          onNewChat={handleNewChat}
          refreshTrigger={refreshTrigger}
        />
      )}

      <main className="flex-1 overflow-auto">
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
              <ChatInterface
                sessionId={currentSessionId}
                onSessionUpdate={handleSessionUpdate}
              />
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
    </div>
  );
}

