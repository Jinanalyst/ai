import { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { LoadingSpinner } from './LoadingSpinner';
import { sendMessage, getMessages, createConversation, updateConversation } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Message, Conversation } from '../types';

interface ChatInterfaceProps {
  conversation: Conversation | null;
  onConversationUpdate: () => void;
}

export function ChatInterface({ conversation, onConversationUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversation) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      const data = await getMessages(conversation.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let currentConversation = conversation;

      // Create conversation if it doesn't exist
      if (!currentConversation) {
        currentConversation = await createConversation({
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        });
        onConversationUpdate();
      }

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content,
        conversation_id: currentConversation.id,
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Prepare message history for context
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Send to API
      const response = await sendMessage({
        message: content,
        conversation_id: currentConversation.id,
        message_history: messageHistory,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: response.message_id || `temp-${Date.now() + 1}`,
        role: 'assistant',
        content: response.reply,
        conversation_id: currentConversation.id,
        user_id: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update conversation title if it's the first message
      if (messages.length === 0 && currentConversation.title === 'New Conversation') {
        await updateConversation(currentConversation.id, {
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        });
        onConversationUpdate();
      }

      // Reload messages to get the actual IDs from database
      await loadMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
      // Remove the temporary user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent">
      <div className="flex-1 overflow-y-auto scroll-smooth">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Start a new conversation</p>
              <p className="text-sm">Type a message below to begin chatting</p>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto w-full px-2 sm:px-6 py-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading && <LoadingSpinner />}
          {error && (
            <div className="p-4 my-3 bg-red-500/10 dark:bg-red-500/15 text-red-700 dark:text-red-300 rounded-2xl border border-red-500/20">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <MessageInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

