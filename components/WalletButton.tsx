'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';

export default function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!publicKey || !connection) return;
    try {
      setLoading(true);
      const balance = await connection.getBalance(publicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
      const interval = setInterval(fetchBalance, 5000);
      return () => clearInterval(interval);
    } else {
      setBalance(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey, connection]);

  const handleConnect = () => {
    setVisible(true);
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (connected && publicKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-500 mb-1">Wallet Address</p>
            <p className="text-xs font-mono text-stone-800 break-all">
              {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-stone-200 text-stone-700 rounded-lg hover:bg-stone-300 transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
        <div>
          <p className="text-xs text-stone-500 mb-1">Balance</p>
          <p className="text-lg font-light text-stone-800">
            {loading ? 'Loading...' : balance !== null ? `${balance.toFixed(4)} SOL` : '—'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="w-full px-6 py-3 bg-stone-800 text-stone-50 rounded-xl hover:bg-stone-700 transition-all text-sm font-medium"
    >
      Connect Wallet
    </button>
  );
}

