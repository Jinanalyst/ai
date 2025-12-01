'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { encodeURL, createQR } from '@solana/pay';
import BigNumber from 'bignumber.js';

// Configuration
const MERCHANT_WALLET = new PublicKey('YOUR_WALLET_ADDRESS_HERE'); // Replace with your actual wallet address
const PAYMENT_AMOUNT = new BigNumber(0.01); // 0.01 SOL
const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';

export default function CheckoutPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [reference] = useState(() => new PublicKey(generateReference()));
  const qrRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a unique reference for this transaction
  function generateReference(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return PublicKey.findProgramAddressSync(
      [bytes],
      new PublicKey('11111111111111111111111111111111')
    )[0].toString();
  }

  // Create QR code on mount
  useEffect(() => {
    async function generateQR() {
      try {
        // Create Solana Pay URL
        const url = encodeURL({
          recipient: MERCHANT_WALLET,
          amount: PAYMENT_AMOUNT,
          reference,
          label: 'Chatai Access',
          message: 'Payment for Chatai AI Chat Access',
        });

        // Generate QR code
        const qr = createQR(url, 350, 'transparent');

        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          qr.append(qrRef.current);
        }

        setQrCode(url.toString());

        // Start monitoring for payment
        startPaymentMonitoring();
      } catch (error: any) {
        console.error('Error generating QR code:', error);
        setStatus('error');
        setErrorMessage('Failed to generate payment QR code');
      }
    }

    generateQR();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [reference]);

  // Monitor for payment confirmation
  async function startPaymentMonitoring() {
    const connection = new Connection(SOLANA_RPC, 'confirmed');

    intervalRef.current = setInterval(async () => {
      try {
        const signatures = await connection.getSignaturesForAddress(
          reference,
          { limit: 1 },
          'confirmed'
        );

        if (signatures.length > 0) {
          setStatus('confirming');
          const signature = signatures[0].signature;

          // Verify the transaction
          const transaction = await connection.getTransaction(signature, {
            commitment: 'confirmed',
          });

          if (transaction) {
            // Check if the transaction was successful
            if (transaction.meta && transaction.meta.err === null) {
              // Verify the amount and recipient
              const accountIndex = transaction.transaction.message.accountKeys.findIndex(
                (key) => key.equals(MERCHANT_WALLET)
              );

              if (accountIndex !== -1) {
                const postBalance = transaction.meta.postBalances[accountIndex];
                const preBalance = transaction.meta.preBalances[accountIndex];
                const amountReceived = (postBalance - preBalance) / LAMPORTS_PER_SOL;

                if (amountReceived >= PAYMENT_AMOUNT.toNumber()) {
                  // Payment confirmed!
                  setStatus('confirmed');

                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                  }

                  // Redirect to AI chat after 2 seconds
                  setTimeout(() => {
                    router.push('/ai');
                  }, 2000);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment:', error);
      }
    }, 2000); // Check every 2 seconds
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo.svg" alt="Chatai Logo" className="w-12 h-12" />
              <h1 className="text-3xl font-bold text-gray-900">Chatai</h1>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Complete Your Payment</h2>
            <p className="text-gray-600 mt-2">Scan the QR code with your Solana wallet</p>
          </div>

          {/* Payment Details */}
          <div className="bg-blue-50 rounded-lg p-4 mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Amount:</span>
              <span className="text-xl font-bold text-gray-900">{PAYMENT_AMOUNT.toString()} SOL</span>
            </div>
            <div className="text-sm text-gray-600">
              One-time payment for AI chat access
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center space-y-4 mb-8">
            {status === 'pending' && (
              <>
                <div
                  ref={qrRef}
                  className="bg-white p-4 rounded-lg border-2 border-gray-200"
                />
                <p className="text-sm text-gray-600 text-center max-w-md">
                  Use Phantom, Solflare, or any Solana wallet that supports Solana Pay
                </p>
              </>
            )}

            {status === 'confirming' && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-semibold text-gray-800">Confirming Payment...</p>
                <p className="text-sm text-gray-600 mt-2">Please wait while we verify your transaction</p>
              </div>
            )}

            {status === 'confirmed' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-2xl font-bold text-green-600 mb-2">Payment Confirmed!</p>
                <p className="text-gray-600">Redirecting to AI chat...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-2xl font-bold text-red-600 mb-2">Error</p>
                <p className="text-gray-600">{errorMessage}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          {status === 'pending' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-800 mb-3">How to pay:</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="font-semibold text-blue-600 mr-2">1.</span>
                  <span>Open your Solana wallet app (Phantom, Solflare, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-600 mr-2">2.</span>
                  <span>Scan the QR code above</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-600 mr-2">3.</span>
                  <span>Confirm the transaction in your wallet</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-600 mr-2">4.</span>
                  <span>Wait for confirmation (usually takes a few seconds)</span>
                </li>
              </ol>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Secure payment on Solana blockchain • Transaction is instant and secure
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
