import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder = 'Type your message...' }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/40 backdrop-blur"
    >
      <div className="flex items-end gap-2 p-4 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 px-4 py-3 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-400"
          style={{ minHeight: '48px', maxHeight: '200px' }}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="flex items-center justify-center w-11 h-11 rounded-2xl text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
}

