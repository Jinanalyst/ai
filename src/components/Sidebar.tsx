import { Plus, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ConversationItem } from './ConversationItem';
import { getConversations, deleteConversation, updateConversation } from '../lib/api';
import type { Conversation } from '../types';

interface SidebarProps {
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation | null) => void;
  onNewConversation: () => void;
  refreshKey?: number;
}

export function Sidebar({ activeConversationId, onSelectConversation, onNewConversation, refreshKey = 0 }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [refreshKey]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteConversation(id);
        if (activeConversationId === id) {
          onSelectConversation(null);
        }
        await loadConversations();
      } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Failed to delete conversation');
      }
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await updateConversation(id, { title });
      await loadConversations();
    } catch (error) {
      console.error('Error renaming conversation:', error);
      alert('Failed to rename conversation');
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[18rem] bg-white/70 dark:bg-slate-950/40 backdrop-blur border-r border-slate-200/70 dark:border-slate-800/70 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm transition-colors bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <Plus size={20} />
          <span>New Chat</span>
        </button>
      </div>
      <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/40"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-6 text-sm">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={() => onSelectConversation(conversation)}
                onDelete={() => handleDelete(conversation.id)}
                onRename={(title) => handleRename(conversation.id, title)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

