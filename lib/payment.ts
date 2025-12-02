import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface PaymentRecord {
  id: string;
  wallet_address: string;
  transaction_signature: string;
  payment_id: string;
  amount: number;
  currency: string;
  network: string;
  memo: string;
  status: 'pending' | 'confirmed' | 'failed';
  faucet_address: string;
  created_at: string;
  confirmed_at: string | null;
  block_slot: number | null;
  error_message: string | null;
}

/**
 * Process a mainnet payment for wallet connection
 */
export async function processMainnetPayment(walletAddress: string, memo?: string): Promise<{
  success: boolean;
  signature?: string;
  paymentId?: string;
  error?: string;
}> {
  try {
    const response = await fetch('/api/payment/mainnet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        memo: memo || `wallet-connect-${Date.now()}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Payment processing failed',
      };
    }

    // Save payment to database
    const { error: dbError } = await supabase
      .from('payments')
      .insert([
        {
          wallet_address: walletAddress,
          transaction_signature: data.signature,
          payment_id: data.paymentId,
          amount: data.amount,
          currency: data.currency,
          network: data.network,
          memo: data.memo,
          status: 'pending',
          faucet_address: data.faucetAddress,
        },
      ]);

    if (dbError) {
      console.error('Error saving payment to database:', dbError);
    }

    return {
      success: true,
      signature: data.signature,
      paymentId: data.paymentId,
    };
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process payment',
    };
  }
}

/**
 * Verify payment status by transaction signature
 */
export async function verifyPayment(signature: string, walletAddress: string): Promise<{
  verified: boolean;
  memo?: string;
  confirmed?: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(
      `/api/payment/mainnet?signature=${signature}&wallet=${walletAddress}`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        verified: false,
        error: data.error,
      };
    }

    // Update payment status in database
    if (data.confirmed) {
      const { error: dbError } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          block_slot: data.slot,
        })
        .eq('transaction_signature', signature);

      if (dbError) {
        console.error('Error updating payment status:', dbError);
      }
    }

    return {
      verified: true,
      memo: data.memo,
      confirmed: data.confirmed,
    };
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return {
      verified: false,
      error: error.message || 'Failed to verify payment',
    };
  }
}

/**
 * Get payment history for a wallet
 */
export async function getPaymentHistory(walletAddress: string): Promise<PaymentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  } catch (error: any) {
    console.error('Error getting payment history:', error);
    return [];
  }
}

/**
 * Get the most recent payment for a wallet
 */
export async function getLatestPayment(walletAddress: string): Promise<PaymentRecord | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error: any) {
    console.error('Error getting latest payment:', error);
    return null;
  }
}

/**
 * Check if a wallet has made a payment
 */
export async function hasValidPayment(walletAddress: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('status', 'confirmed')
      .limit(1);

    if (error || !data || data.length === 0) {
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Error checking payment:', error);
    return false;
  }
}
