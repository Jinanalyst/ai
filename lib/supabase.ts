import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ChatMessage {
  id?: string;
  wallet_address: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

// Save a message to Supabase
export async function saveMessage(message: ChatMessage) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          wallet_address: message.wallet_address,
          role: message.role,
          content: message.content,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

// Load chat history for a specific wallet
export async function loadChatHistory(walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading chat history:', error);
    throw error;
  }
}
