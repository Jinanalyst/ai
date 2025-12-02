import {
  Connection,
  VersionedTransaction,
  Transaction,
  PublicKey
} from '@solana/web3.js';

/**
 * Safely get the first account key (sender/fee payer) from a Solana transaction
 * Handles both legacy Transaction and VersionedTransaction types
 */
export function getTransactionSender(
  transaction: Transaction | VersionedTransaction
): PublicKey {
  // Check if it's a versioned transaction
  if ('version' in transaction) {
    // For versioned transactions, use getAccountKeys()
    // The first account is always the fee payer (sender)
    const accountKeys = transaction.message.getAccountKeys();
    return accountKeys.get(0)!;
  } else {
    // For legacy transactions, the fee payer is the sender
    const legacyTx = transaction as Transaction;
    if (!legacyTx.feePayer) {
      throw new Error('Transaction has no fee payer set');
    }
    return legacyTx.feePayer;
  }
}

/**
 * Verify a transaction's sender matches the expected wallet address
 */
export function verifyTransactionSender(
  transaction: Transaction | VersionedTransaction,
  expectedWalletAddress: string
): boolean {
  const senderPubkey = getTransactionSender(transaction);
  return senderPubkey.toString() === expectedWalletAddress;
}

/**
 * Deserialize and verify a transaction from a base58 or buffer
 */
export async function deserializeAndVerifyTransaction(
  serializedTransaction: string | Buffer,
  expectedWalletAddress: string,
  connection: Connection
): Promise<{
  transaction: Transaction | VersionedTransaction;
  isValid: boolean;
  error?: string;
}> {
  try {
    // Convert to buffer if string
    const buffer = typeof serializedTransaction === 'string'
      ? Buffer.from(serializedTransaction, 'base64')
      : serializedTransaction;

    // Try to deserialize as versioned transaction first
    let transaction: Transaction | VersionedTransaction;
    try {
      transaction = VersionedTransaction.deserialize(buffer);
    } catch {
      // If that fails, try legacy transaction
      transaction = Transaction.from(buffer);
    }

    // Verify the sender
    const isValid = verifyTransactionSender(transaction, expectedWalletAddress);

    if (!isValid) {
      return {
        transaction,
        isValid: false,
        error: 'Transaction sender does not match provided wallet address'
      };
    }

    return { transaction, isValid: true };
  } catch (error: any) {
    return {
      transaction: null as any,
      isValid: false,
      error: error.message || 'Failed to deserialize transaction'
    };
  }
}
