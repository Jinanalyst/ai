export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  conversation_id: string | null;
  user_id: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  message_history?: Array<{
    role: MessageRole;
    content: string;
  }>;
}

export interface ChatResponse {
  reply: string;
  message_id?: string;
  conversation_id?: string;
  error?: string;
}

export interface CreateConversationRequest {
  title?: string;
  user_id?: string | null;
}

export interface UpdateConversationRequest {
  title: string;
}

