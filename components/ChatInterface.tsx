'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  rewardTx?: string;
}

export default function ChatInterface() {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rewardLoading, setRewardLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendReward = async (): Promise<{ signature: string | null; error?: string }> => {
    if (!publicKey) return { signature: null };

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
        const errorMsg = data.error || 'Failed to send reward';
        console.error('Reward error:', errorMsg);
        return { signature: null, error: errorMsg };
      }

      return { signature: data.signature };
    } catch (error: any) {
      console.error('Reward error:', error);
      return { signature: null, error: error.message || 'Failed to send reward' };
    } finally {
      setRewardLoading(false);
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
      let rewardTx: string | undefined = undefined;
      let rewardError: string | undefined = undefined;

      const rewardResult = await sendReward();
      if (rewardResult.signature) {
        rewardTx = rewardResult.signature;
      } else if (rewardResult.error) {
        rewardError = rewardResult.error;
        console.warn('Reward failed, continuing with chat:', rewardError);
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: currentInput,
        rewardTx,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Show reward error as a warning if it failed
      if (rewardError && !rewardTx) {
        const warningMessage: Message = {
          id: `${Date.now()}-warning`,
          role: 'assistant',
          content: `⚠️ Note: ${rewardError}`,
        };
        setMessages((prev) => [...prev, warningMessage]);
      }

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          history: updatedMessages
            .filter((msg) => {
              // Exclude error and warning messages from history
              if (msg.role === 'assistant' && (msg.content.startsWith('Error:') || msg.content.startsWith('⚠️'))) {
                return false;
              }
              return true;
            })
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get AI response`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'No response received',
      };

      setMessages((prev) => [...prev, assistantMessage]);
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
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Start a conversation! You&apos;ll earn CHAT token for each message.</p>
          </div>
        )}

        {messages.map((message) => {
          const isWarning = message.role === 'assistant' && message.content.startsWith('⚠️');
          const isError = message.role === 'assistant' && message.content.startsWith('Error:');

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : isError
                    ? 'bg-red-50 text-red-900 border border-red-200'
                    : isWarning
                    ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                {message.rewardTx && (
                  <p className="text-xs mt-1 opacity-75">
                    ✓ Reward: {message.rewardTx.slice(0, 8)}...
                  </p>
                )}
              </div>
            </div>
          );
        })}

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
    </div>
  );
}

