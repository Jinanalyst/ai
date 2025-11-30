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

      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          history: updatedMessages
            .filter((msg) => msg.role !== 'assistant' || !msg.content.startsWith('Error:'))
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
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto mb-6 space-y-3 px-2">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-stone-400">
            <p className="text-sm">Say hello to start chatting</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-xl ${
                message.role === 'user'
                  ? 'bg-stone-800 text-stone-50'
                  : 'bg-stone-100 text-stone-800'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
              {message.rewardTx && (
                <p className="text-xs mt-2 opacity-60">
                  Confirmed
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 text-stone-700 px-4 py-3 rounded-xl">
              <p className="text-sm">Typing...</p>
            </div>
          </div>
        )}

        {rewardLoading && (
          <div className="flex justify-center">
            <p className="text-xs text-stone-400">Processing...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a message..."
          disabled={loading || rewardLoading}
          className="flex-1 px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-400 disabled:bg-stone-50 disabled:text-stone-400 transition-colors text-sm"
        />
        <button
          type="submit"
          disabled={loading || rewardLoading || !input.trim()}
          className="px-5 py-3 bg-stone-800 text-stone-50 rounded-xl hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-all text-sm font-medium"
        >
          Send
        </button>
      </form>
    </div>
  );
}

