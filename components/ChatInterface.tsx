'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { loadChatHistory, saveMessage } from '@/lib/supabase';

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

  // Load chat history when wallet connects
  useEffect(() => {
    const loadHistory = async () => {
      if (!publicKey) {
        setMessages([]);
        return;
      }

      try {
        const history = await loadChatHistory(publicKey.toString());
        const formattedMessages: Message[] = history.map((msg) => ({
          id: msg.id || Date.now().toString(),
          role: msg.role,
          content: msg.content,
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadHistory();
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
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to read as text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
            }
          } catch {
            // Use default error message if text reading also fails
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
    </div>
  );
}

