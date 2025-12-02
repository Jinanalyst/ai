/**
 * Solana Payment Gateway Configuration
 * Mainnet SOL payments for wallet connection
 */

export const PAYMENT_CONFIG = {
  // Mainnet RPC endpoint
  mainnetRpc: 'https://api.mainnet-beta.solana.com',

  // Payment details
  paymentAmount: 0.3, // SOL
  minimumPaymentAmount: 0.3, // SOL

  // Faucet wallet configuration
  minimumFaucetBalance: 0.01, // Minimum SOL in faucet to process payments

  // Transaction settings
  commitment: 'confirmed' as const,
  maxRetries: 3,

  // Memo settings
  memoProgram: 'MemoSq4gDiRvZn2rRQZwuNjBtmnvuJ7FSZiAZgnAXJ',
  defaultMemoPrefix: 'solana-chat-payment',

  // Devnet configuration (for chat/rewards)
  devnetRpc: 'https://api.devnet.solana.com',

  // Database configuration
  paymentTableName: 'payments',

  // Status tracking
  paymentStatuses: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
  },
};

/**
 * Environment variable requirements for payment gateway
 */
export const REQUIRED_ENV_VARS = {
  MAINNET_FAUCET_PRIVATE_KEY: 'Private key of the mainnet faucet wallet',
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',
};

/**
 * Payment gateway status codes
 */
export const PAYMENT_STATUS_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  FAUCET_LOW_BALANCE: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  INVALID_CONFIG: 500,
} as const;

/**
 * Get payment memo from transaction
 */
export function generatePaymentMemo(walletAddress: string, timestamp?: number): string {
  return `${PAYMENT_CONFIG.defaultMemoPrefix}-${walletAddress.substring(0, 8)}-${timestamp || Date.now()}`;
}

/**
 * Payment ID format for tracking
 */
export function generatePaymentId(signature: string, walletAddress: string): string {
  return `${signature.substring(0, 8)}-${walletAddress.substring(0, 8)}`;
}

/**
 * Validate configuration
 */
export function validatePaymentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.MAINNET_FAUCET_PRIVATE_KEY) {
    errors.push('MAINNET_FAUCET_PRIVATE_KEY environment variable is required');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
