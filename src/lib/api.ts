import { supabase } from './supabase';
import type {
  Message,
  Conversation,
  ChatRequest,
  ChatResponse,
  CreateConversationRequest,
  UpdateConversationRequest,
} from '../types';

const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL || '';

// Get the Supabase project URL from the client
function getSupabaseUrl(): string {
  // Access the internal URL property
  const url = (supabase as any).supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('Supabase URL is not configured');
  }
  return url;
}

// Get the Supabase function URL
function getFunctionUrl(functionName: string): string {
  if (SUPABASE_FUNCTION_URL) {
    return `${SUPABASE_FUNCTION_URL}/${functionName}`;
  }
  const baseUrl = getSupabaseUrl();
  return `${baseUrl}/functions/v1/${functionName}`;
}

// Chat API
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(getFunctionUrl('chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Conversation API
export async function createConversation(
  request: CreateConversationRequest = {}
): Promise<Conversation> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user?.id || null,
        title: request.title || 'New Conversation',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

export async function getConversation(id: string): Promise<Conversation | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

export async function updateConversation(
  id: string,
  request: UpdateConversationRequest
): Promise<Conversation> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .update({ title: request.title })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}

export async function deleteConversation(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// Messages API
export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

// Export/Import utilities
export function exportConversation(conversation: Conversation, messages: Message[]): string {
  return JSON.stringify({
    conversation,
    messages,
    exported_at: new Date().toISOString(),
  }, null, 2);
}

export function exportAllConversations(conversations: Conversation[]): string {
  return JSON.stringify({
    conversations,
    exported_at: new Date().toISOString(),
  }, null, 2);
}

export function importConversations(jsonString: string): {
  conversations: Conversation[];
  messages: Message[];
} {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (data.conversations && Array.isArray(data.conversations)) {
      return {
        conversations: data.conversations,
        messages: data.messages || [],
      };
    }
    
    // Single conversation format
    if (data.conversation) {
      return {
        conversations: [data.conversation],
        messages: data.messages || [],
      };
    }
    
    throw new Error('Invalid import format');
  } catch (error) {
    console.error('Error importing conversations:', error);
    throw new Error('Failed to parse import file');
  }
}

