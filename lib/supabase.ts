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

export interface UserCredits {
  wallet_address: string;
  messages_remaining: number;
  total_messages_purchased: number;
  total_messages_used: number;
  last_purchase_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentTransaction {
  id?: string;
  wallet_address: string;
  transaction_signature: string;
  amount_sol: number;
  messages_credited: number;
  status: 'pending' | 'verified' | 'failed';
  verified_at?: string;
  created_at?: string;
}

// Get user credits
export async function getUserCredits(walletAddress: string): Promise<UserCredits | null> {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      // If user doesn't exist, create with 0 credits
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert([
            {
              wallet_address: walletAddress,
              messages_remaining: 0,
              total_messages_purchased: 0,
              total_messages_used: 0,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

// Decrement message credits (use a message)
export async function useMessageCredit(walletAddress: string): Promise<boolean> {
  try {
    const credits = await getUserCredits(walletAddress);
    if (!credits || credits.messages_remaining <= 0) {
      return false;
    }

    const { error } = await supabase
      .from('user_credits')
      .update({
        messages_remaining: credits.messages_remaining - 1,
        total_messages_used: (credits.total_messages_used || 0) + 1,
      })
      .eq('wallet_address', walletAddress);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error using message credit:', error);
    throw error;
  }
}

// Add credits to user account
export async function addMessageCredits(
  walletAddress: string,
  messagesToAdd: number
): Promise<UserCredits> {
  try {
    const credits = await getUserCredits(walletAddress);
    if (!credits) {
      throw new Error('Failed to get user credits');
    }

    const { data, error } = await supabase
      .from('user_credits')
      .update({
        messages_remaining: credits.messages_remaining + messagesToAdd,
        total_messages_purchased: credits.total_messages_purchased + messagesToAdd,
        last_purchase_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding message credits:', error);
    throw error;
  }
}

// Record payment transaction
export async function recordPaymentTransaction(
  transaction: Omit<PaymentTransaction, 'id' | 'created_at'>
): Promise<PaymentTransaction> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recording payment transaction:', error);
    throw error;
  }
}

// Get payment transaction by signature
export async function getPaymentBySignature(
  signature: string
): Promise<PaymentTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('transaction_signature', signature)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error getting payment by signature:', error);
    throw error;
  }
}
