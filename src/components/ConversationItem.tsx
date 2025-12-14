import { Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import type { Conversation } from '../types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-500/10 dark:bg-blue-500/15 text-slate-900 dark:text-slate-100 ring-1 ring-inset ring-blue-500/10'
          : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
      }`}
      onClick={onSelect}
    >
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          autoFocus
        />
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{conversation.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {new Date(conversation.updated_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
              title="Rename conversation"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg hover:bg-red-500/10 dark:hover:bg-red-500/15 text-red-600 dark:text-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
              title="Delete conversation"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

