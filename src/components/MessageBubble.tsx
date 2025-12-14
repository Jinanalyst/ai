import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = message.role === 'user';

  return (
    <div className="py-3">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-full`}>
          <div
            className={`max-w-[85vw] sm:max-w-[36rem] md:max-w-[42rem] rounded-2xl px-4 py-3 shadow-sm ${
              isUser
                ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                : 'bg-white/75 dark:bg-slate-900/45 text-slate-900 dark:text-slate-100 border border-slate-200/70 dark:border-slate-800/70'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>

          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200/70 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              title="Copy message"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          )}
        </div>
      </div>

      <div className={`mt-1 text-xs text-slate-500 dark:text-slate-400 ${isUser ? 'text-right' : 'text-left'}`}>
        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

