'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import WalletButton from '@/components/WalletButton';
import ChatInterface from '@/components/ChatInterface';

const PAYMENT_AMOUNT = 0.1; // 0.1 SOL
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || 'DemoWallet111111111111111111111111111111111';

export default function AIPage() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  // Check payment status
  useEffect(() => {
    const checkPayment = async () => {
      if (!publicKey) return;

      try {
        setChecking(true);
        const response = await fetch(`/api/payment?wallet=${publicKey.toString()}`);
        const data = await response.json();

        setHasPaid(data.hasPaid);
      } catch (error) {
        console.error('Error checking payment:', error);
        setHasPaid(false);
      } finally {
        setChecking(false);
      }
    };

    if (connected && publicKey) {
      checkPayment();
    }
  }, [connected, publicKey]);

  const handlePayment = async () => {
    if (!publicKey || !connection) return;

    try {
      setPaying(true);
      setPaymentError(null);

      // Create payment transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PLATFORM_WALLET),
          lamports: PAYMENT_AMOUNT * LAMPORTS_PER_SOL,
        })
      );

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Verify payment on backend
      const verifyResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          walletAddress: publicKey.toString(),
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.success) {
        setHasPaid(true);
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

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

          {checking ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <p className="text-gray-600">Checking payment status...</p>
              </div>
            </div>
          ) : hasPaid ? (
            <ChatInterface />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Required</h2>
                  <p className="text-gray-600 mb-2">
                    To use the AI chat platform, please make a one-time payment of:
                  </p>
                  <p className="text-3xl font-bold text-blue-600 mb-4">{PAYMENT_AMOUNT} SOL</p>
                  <p className="text-sm text-gray-500">
                    This payment grants you unlimited access to chat with AI and earn CHAT tokens
                  </p>
                </div>

                {paymentError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{paymentError}</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                >
                  {paying ? 'Processing Payment...' : `Pay ${PAYMENT_AMOUNT} SOL`}
                </button>

                <p className="text-xs text-gray-500 mt-4">
                  Make sure you have enough SOL in your wallet for the payment and transaction fees
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
