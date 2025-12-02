'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { loadChatHistory, saveMessage, getUserCredits, type UserCredits } from '@/lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rewardTx?: string;
}

export default function ChatInterface() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history and credits when wallet connects
  useEffect(() => {
    const loadData = async () => {
      if (!publicKey) {
        setMessages([]);
        setCredits(null);
        return;
      }

      try {
        // Load chat history
        const history = await loadChatHistory(publicKey.toString());
        const formattedMessages: Message[] = history.map((msg) => ({
          id: msg.id || Date.now().toString(),
          role: msg.role,
          content: msg.content,
        }));
        setMessages(formattedMessages);

        // Load credits
        const userCredits = await getUserCredits(publicKey.toString());
        setCredits(userCredits);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [publicKey]);

  // Refresh credits periodically
  useEffect(() => {
    if (!publicKey) return;

    const refreshCredits = async () => {
      try {
        const userCredits = await getUserCredits(publicKey.toString());
        setCredits(userCredits);
      } catch (error) {
        console.error('Failed to refresh credits:', error);
      }
    };

    const interval = setInterval(refreshCredits, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [publicKey]);

  const sendReward = async (): Promise<string | null> => {
    if (!publicKey) return null;

    try {
      setRewardLoading(true);
      const response = await fetch('/api/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reward');
      }

      return data.signature;
    } catch (error) {
      console.error('Reward error:', error);
      return null;
    } finally {
      setRewardLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!publicKey || !sendTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    const paymentReceiverWallet = process.env.NEXT_PUBLIC_PAYMENT_RECEIVER_WALLET;
    if (!paymentReceiverWallet) {
      alert('Payment receiver wallet not configured');
      return;
    }

    try {
      setPaymentLoading(true);

      // Create transaction to send 0.3 SOL
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(paymentReceiverWallet),
          lamports: 0.3 * LAMPORTS_PER_SOL,
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Verify payment on backend
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionSignature: signature,
          walletAddress: publicKey.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      // Refresh credits
      const userCredits = await getUserCredits(publicKey.toString());
      setCredits(userCredits);

      alert(`Success! ${data.messagesAdded} messages added to your account.`);
      setShowPaymentModal(false);
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message || 'Unknown error'}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !publicKey) return;

    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      // Send reward first (don't block chat if reward fails)
      let rewardTx: string | null = null;
      try {
        rewardTx = await sendReward();
      } catch (rewardError) {
        console.warn('Reward failed, continuing with chat:', rewardError);
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: currentInput,
        rewardTx: rewardTx || undefined,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Save user message to Supabase
      try {
        await saveMessage({
          wallet_address: publicKey.toString(),
          role: 'user',
          content: currentInput,
        });
      } catch (error) {
        console.error('Failed to save user message:', error);
      }

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          walletAddress: publicKey.toString(),
          history: updatedMessages
            .filter((msg) => msg.role !== 'assistant' || !msg.content.startsWith('Error:'))
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to get AI response`;
        let errorCode = '';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.code || '';

          // Handle insufficient credits
          if (errorCode === 'INSUFFICIENT_CREDITS' || response.status === 402) {
            setShowPaymentModal(true);
            throw new Error('Insufficient message credits. Please purchase more messages to continue.');
          }
        } catch (parseError) {
          // If JSON parsing fails, try to read as text
          if (!(parseError instanceof Error && parseError.message.includes('Insufficient message credits'))) {
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
              }
            } catch {
              // Use default error message if text reading also fails
            }
          } else {
            throw parseError;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'No response received',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save AI response to Supabase
      try {
        await saveMessage({
          wallet_address: publicKey.toString(),
          role: 'assistant',
          content: data.reply || 'No response received',
        });
      } catch (error) {
        console.error('Failed to save AI response:', error);
      }

      // Refresh credits after successful message
      try {
        const userCredits = await getUserCredits(publicKey.toString());
        setCredits(userCredits);
      } catch (error) {
        console.error('Failed to refresh credits:', error);
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error.message || 'Unable to process your message. Please try again.'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Credits Header */}
      {publicKey && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Messages Remaining: <span className="text-blue-600 font-bold">{credits?.messages_remaining || 0}</span>
            </p>
            {credits && credits.messages_remaining === 0 && (
              <p className="text-xs text-red-600 mt-1">Purchase more messages to continue chatting</p>
            )}
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buy 500 Messages
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Start a conversation! You&apos;ll earn CHAT tokens for each message.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              {message.rewardTx && (
                <p className="text-xs mt-1 opacity-75">
                  Reward: {message.rewardTx.slice(0, 8)}...
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
              <p className="text-sm animate-pulse">AI is thinking...</p>
            </div>
          </div>
        )}

        {rewardLoading && (
          <div className="flex justify-center">
            <p className="text-xs text-gray-500">Sending reward...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading || rewardLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || rewardLoading || !input.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          Send
        </button>
      </form>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Purchase Messages</h2>
            <div className="mb-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-lg font-semibold text-blue-900">500 Messages</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">0.3 SOL</p>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  500 AI chat messages
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Powered by Claude AI
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Earn CHAT token rewards
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? 'Processing...' : 'Pay 0.3 SOL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

