'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
}

interface SidebarProps {
  walletAddress: string | null;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

function SortableSession({
  session,
  isActive,
  onClick,
}: {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-lg transition-colors cursor-move ${
        isActive
          ? 'bg-stone-100 text-stone-900'
          : 'text-stone-700 hover:bg-stone-50'
      }`}
    >
      <p className="text-sm font-medium truncate mb-1">
        {session.title}
      </p>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>{session.messageCount} messages</span>
        <span>{formatDate(session.timestamp)}</span>
      </div>
    </button>
  );
}

export default function Sidebar({
  walletAddress,
  currentSessionId,
  onSessionSelect,
  onNewChat,
  refreshTrigger,
}: SidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (walletAddress) {
      loadSessions();
    } else {
      setSessions([]);
    }
  }, [walletAddress, refreshTrigger]);

  const loadSessions = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/sessions?walletAddress=${walletAddress}`);

      if (response.ok) {
        const data = await response.json();
        const sortedSessions = (data.sessions || []).sort(
          (a: ChatSession, b: ChatSession) => b.timestamp - a.timestamp
        );
        setSessions(sortedSessions);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sessions.findIndex((s) => s.id === active.id);
      const newIndex = sessions.findIndex((s) => s.id === over.id);

      const newSessions = arrayMove(sessions, oldIndex, newIndex);
      setSessions(newSessions);

      // Save the new order to the server
      if (walletAddress) {
        try {
          await fetch('/api/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress,
              sessions: newSessions,
            }),
          });
        } catch (error) {
          console.error('Error saving session order:', error);
        }
      }
    }
  };

  if (!walletAddress) return null;

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 bg-stone-800 text-stone-50 rounded-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-stone-100">
          <button
            onClick={() => {
              onNewChat();
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 bg-stone-800 text-stone-50 rounded-xl hover:bg-stone-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <h3 className="text-xs font-medium text-stone-500 uppercase tracking-wide px-3 mb-2">
            Chat History
          </h3>

          {sessions.length === 0 ? (
            <p className="text-xs text-stone-400 px-3 py-4">
              No previous chats
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sessions.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {sessions.map((session) => (
                    <SortableSession
                      key={session.id}
                      session={session}
                      isActive={currentSessionId === session.id}
                      onClick={() => {
                        onSessionSelect(session.id);
                        setIsOpen(false);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="p-4 border-t border-stone-100">
          <p className="text-xs text-stone-400 text-center">
            Drag to reorder chats
          </p>
        </div>
      </aside>
    </>
  );
}
