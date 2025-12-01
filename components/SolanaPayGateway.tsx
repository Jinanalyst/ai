'use client';

import { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import QRCode from 'qrcode';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const PAYMENT_ADDRESS = 'DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2';
const PAYMENT_AMOUNT = 0.3; // SOL

export function SolanaPayGateway() {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [transactionSignature, setTransactionSignature] = useState<string>('');

  const generatePaymentQR = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Create solana: URL for Solana Pay
      const solanaPayUrl = `solana:${PAYMENT_ADDRESS}?amount=${PAYMENT_AMOUNT}&label=Chatai&message=Support%20AI%20Chat&memo=chatai-payment`;

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(solanaPayUrl);
      setQrCode(qrDataUrl);
    } catch (err) {
      setError('Failed to generate QR code');
      console.error('QR Code generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPayment = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Check if wallet is available
      if (!window.solana) {
        setError('Please install a Solana wallet (Phantom, Solflare, etc.)');
        return;
      }

      // Connect to wallet
      const connection = new Connection(MAINNET_RPC);
      const wallet = window.solana;

      // Request connection if not already connected
      if (!wallet.isConnected) {
        await wallet.connect();
      }

      const fromPubKey = wallet.publicKey;
      const toPubKey = new PublicKey(PAYMENT_ADDRESS);

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();

      // Create transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: fromPubKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: fromPubKey,
          toPubkey: toPubKey,
          lamports: PAYMENT_AMOUNT * LAMPORTS_PER_SOL,
        })
      );

      // Sign and send transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());

      // Wait for confirmation
      await connection.confirmTransaction(signature);

      setTransactionSignature(signature);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Solana Pay Gateway</h2>
        <p className="text-gray-600 mb-4">Support AI Chat & Earn CHAT Tokens</p>
        <div className="bg-indigo-100 border-l-4 border-indigo-500 p-4 text-left rounded">
          <p className="text-sm text-indigo-700">
            <strong>🎁 Earn CHAT Tokens:</strong> Every message you send to our AI earns you CHAT tokens as rewards!
            Make a payment of <strong>0.3 SOL</strong> to unlock premium features and accelerate your token earning.
          </p>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="bg-white p-6 rounded-lg mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Scan to Pay</h3>
        {qrCode ? (
          <div className="flex flex-col items-center">
            <img src={qrCode} alt="Solana Pay QR Code" className="w-64 h-64 border-4 border-indigo-500 rounded-lg" />
            <p className="mt-4 text-sm text-gray-600">
              Scan with your Solana wallet app to send {PAYMENT_AMOUNT} SOL
            </p>
          </div>
        ) : (
          <button
            onClick={generatePaymentQR}
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Generating QR...' : 'Generate Payment QR'}
          </button>
        )}
      </div>

      {/* Direct Payment Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Or Pay Directly</h3>
        <button
          onClick={handleDirectPayment}
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Processing...' : `Send ${PAYMENT_AMOUNT} SOL from Wallet`}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <p className="text-green-700 font-semibold mb-2">✓ Payment Successful!</p>
          <p className="text-sm text-green-600 break-all">
            Transaction: {transactionSignature}
          </p>
          <p className="text-sm text-green-600 mt-2">
            You can now enjoy premium features and earn CHAT tokens while chatting with AI!
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-red-700 font-semibold mb-2">✗ Error</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Payment Details */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
        <h4 className="font-semibold mb-2">Payment Details:</h4>
        <ul className="space-y-1">
          <li><strong>Amount:</strong> {PAYMENT_AMOUNT} SOL</li>
          <li><strong>Network:</strong> Solana Mainnet</li>
          <li><strong>Recipient:</strong> {PAYMENT_ADDRESS.slice(0, 8)}...{PAYMENT_ADDRESS.slice(-8)}</li>
          <li><strong>Benefit:</strong> Unlock premium chat features & earn CHAT token rewards</li>
        </ul>
      </div>
    </div>
  );
}
