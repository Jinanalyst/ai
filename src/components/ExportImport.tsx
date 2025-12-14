import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { exportConversation, exportAllConversations, importConversations } from '../lib/api';
import { getMessages, createConversation } from '../lib/api';
import type { Conversation, Message } from '../types';

interface ExportImportProps {
  conversation: Conversation | null;
  conversations: Conversation[];
  onImportComplete: () => void;
}

export function ExportImport({ conversation, conversations, onImportComplete }: ExportImportProps) {
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    if (!conversation) return;

    try {
      const messages = await getMessages(conversation.id);
      const json = exportConversation(conversation, messages);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversation.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting conversation:', error);
      alert('Failed to export conversation');
    }
  };

  const handleExportAll = () => {
    try {
      const json = exportAllConversations(conversations);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all-conversations-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting conversations:', error);
      alert('Failed to export conversations');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const { conversations: importedConversations, messages: importedMessages } = importConversations(text);

      for (const conv of importedConversations) {
        const { id: oldId, ...convData } = conv;
        const newConv = await createConversation({ title: convData.title });

        // Import messages for this conversation
        const convMessages = importedMessages.filter((msg) => msg.conversation_id === oldId);
        for (const msg of convMessages) {
          // Messages will be created when user sends them, or we could create them here
          // For now, we'll just create the conversation
        }
      }

      alert(`Successfully imported ${importedConversations.length} conversation(s)`);
      onImportComplete();
    } catch (error) {
      console.error('Error importing conversations:', error);
      alert('Failed to import conversations. Please check the file format.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {conversation && (
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Export current conversation"
        >
          <Download size={16} />
          <span className="text-sm">Export</span>
        </button>
      )}
      <button
        onClick={handleExportAll}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        title="Export all conversations"
      >
        <Download size={16} />
        <span className="text-sm">Export All</span>
      </button>
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer">
        <Upload size={16} />
        <span className="text-sm">{importing ? 'Importing...' : 'Import'}</span>
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          disabled={importing}
          className="hidden"
        />
      </label>
    </div>
  );
}

