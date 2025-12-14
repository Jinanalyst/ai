import { useEffect, useMemo, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthButton } from './components/AuthButton';
import { ExportImport } from './components/ExportImport';
import { getConversations } from './lib/api';
import type { Conversation } from './types';

export default function App() {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeConversationId = useMemo(() => activeConversation?.id ?? null, [activeConversation]);

  const reloadConversations = async () => {
    try {
      const data = await getConversations();
      setAllConversations(data);
    } catch {
      // Sidebar will still handle its own errors; keep App resilient.
      setAllConversations([]);
    }
  };

  useEffect(() => {
    reloadConversations();
  }, [refreshKey]);

  const handleConversationUpdate = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleSelectConversation = (conversation: Conversation | null) => {
    setActiveConversation(conversation);
    setSidebarOpen(false);
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 [background:radial-gradient(60rem_40rem_at_50%_-10%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(40rem_30rem_at_90%_0%,rgba(168,85,247,0.10),transparent_55%)]" />

      <header className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="inline-flex md:hidden items-center justify-center rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-sm" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight truncate">AI Chat</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight truncate">
                    Clean, fast, and readable
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="hidden sm:flex items-center">
                <ExportImport
                  conversation={activeConversation}
                  conversations={allConversations}
                  onImportComplete={handleConversationUpdate}
                />
              </div>
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-0 md:px-4">
        <div className="h-[calc(100vh-3.5rem)] md:py-4">
          <div className="h-full md:rounded-3xl md:border md:border-slate-200/70 md:dark:border-slate-800/70 md:bg-white/60 md:dark:bg-slate-950/30 md:backdrop-blur overflow-hidden shadow-sm">
            <div className="h-full flex">
              {/* Sidebar (desktop) */}
              <div className="hidden md:flex h-full">
                <Sidebar
                  activeConversationId={activeConversationId}
                  onSelectConversation={handleSelectConversation}
                  onNewConversation={handleNewConversation}
                  refreshKey={refreshKey}
                />
              </div>

              {/* Sidebar (mobile overlay) */}
              {sidebarOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                  <button
                    className="absolute inset-0 bg-black/40"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                  />
                  <div className="absolute left-0 top-0 h-full w-[18rem] bg-white dark:bg-slate-950 shadow-2xl">
                    <Sidebar
                      activeConversationId={activeConversationId}
                      onSelectConversation={handleSelectConversation}
                      onNewConversation={handleNewConversation}
                      refreshKey={refreshKey}
                    />
                  </div>
                </div>
              )}

              {/* Chat */}
              <div className="flex-1 min-w-0 h-full">
                <ChatInterface conversation={activeConversation} onConversationUpdate={handleConversationUpdate} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
