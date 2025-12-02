'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { processMainnetPayment, verifyPayment } from '@/lib/payment';

export default function WalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);

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

  // Process mainnet payment on wallet connection
  useEffect(() => {
    const processPayment = async () => {
      if (!connected || !publicKey) return;

      setPaymentProcessing(true);
      setPaymentStatus('Processing mainnet payment...');

      try {
        const result = await processMainnetPayment(
          publicKey.toString(),
          `wallet-connect-${publicKey.toString().substring(0, 8)}`
        );

        if (result.success && result.signature) {
          setPaymentStatus('Verifying payment...');

          // Verify payment after a short delay
          await new Promise(resolve => setTimeout(resolve, 2000));

          const verification = await verifyPayment(result.signature, publicKey.toString());
          if (verification.verified) {
            setPaymentVerified(true);
            setPaymentStatus('Payment confirmed! Chat is now enabled.');
          } else {
            setPaymentStatus('Payment processed. Verification pending...');
          }
        } else {
          setPaymentStatus(`Payment pending. Memo: ${result.signature}`);
        }
      } catch (error: any) {
        console.error('Payment processing error:', error);
        setPaymentStatus('Payment processing initiated.');
      } finally {
        setPaymentProcessing(false);
      }
    };

    if (connected && publicKey) {
      processPayment();
    }
  }, [connected, publicKey]);

  // Fetch balance periodically
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Wallet Address</p>
            <p className="text-sm font-mono text-gray-900 break-all">
              {publicKey.toString()}
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
        <div>
          <p className="text-sm text-gray-600">SOL Balance</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? 'Loading...' : balance !== null ? `${balance.toFixed(4)} SOL` : '—'}
          </p>
        </div>
        {paymentStatus && (
          <div className={`p-3 rounded-lg text-sm ${
            paymentVerified ? 'bg-green-100 text-green-800' :
            paymentProcessing ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {paymentStatus}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
    >
      Connect Solana Wallet
    </button>
  );
}

