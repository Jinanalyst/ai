import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  addMessageCredits,
  recordPaymentTransaction,
  getPaymentBySignature,
} from '@/lib/supabase';

const PAYMENT_AMOUNT_SOL = 0.3; // 0.3 SOL per 500 messages
const MESSAGES_PER_PAYMENT = 500;

export async function POST(request: NextRequest) {
  try {
    const { transactionSignature, walletAddress } = await request.json();

    if (!transactionSignature || !walletAddress) {
      return NextResponse.json(
        { error: 'Transaction signature and wallet address are required' },
        { status: 400 }
      );
    }

    // Get payment receiver wallet from environment
    const paymentReceiverWallet = process.env.PAYMENT_RECEIVER_WALLET;
    if (!paymentReceiverWallet) {
      return NextResponse.json(
        { error: 'Payment receiver wallet not configured' },
        { status: 500 }
      );
    }

    // Check if transaction already processed
    const existingPayment = await getPaymentBySignature(transactionSignature);
    if (existingPayment) {
      if (existingPayment.status === 'verified') {
        return NextResponse.json({
          success: true,
          message: 'Payment already processed',
          messagesAdded: existingPayment.messages_credited,
          signature: transactionSignature,
        });
      } else if (existingPayment.status === 'failed') {
        return NextResponse.json(
          { error: 'This transaction was previously marked as failed' },
          { status: 400 }
        );
      }
    }

    // Connect to Solana network
    const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl =
      networkEnv === 'mainnet-beta'
        ? 'https://api.mainnet-beta.solana.com'
        : networkEnv === 'testnet'
        ? 'https://api.testnet.solana.com'
        : 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

    // Fetch and verify the transaction
    let transaction;
    try {
      transaction = await connection.getTransaction(transactionSignature, {
        maxSupportedTransactionVersion: 0,
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transaction from blockchain' },
        { status: 500 }
      );
    }

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found on blockchain' },
        { status: 404 }
      );
    }

    // Verify transaction success
    if (transaction.meta?.err) {
      await recordPaymentTransaction({
        wallet_address: walletAddress,
        transaction_signature: transactionSignature,
        amount_sol: 0,
        messages_credited: 0,
        status: 'failed',
      });

      return NextResponse.json(
        { error: 'Transaction failed on blockchain' },
        { status: 400 }
      );
    }

    // Verify sender is the wallet address provided
    const senderPubkey = transaction.transaction.message.accountKeys[0];
    if (senderPubkey.toString() !== walletAddress) {
      return NextResponse.json(
        { error: 'Transaction sender does not match provided wallet address' },
        { status: 400 }
      );
    }

    // Verify receiver and amount
    const receiverPubkey = new PublicKey(paymentReceiverWallet);
    const preBalances = transaction.meta?.preBalances || [];
    const postBalances = transaction.meta?.postBalances || [];

    let receiverIndex = -1;
    for (let i = 0; i < transaction.transaction.message.accountKeys.length; i++) {
      if (
        transaction.transaction.message.accountKeys[i].toString() ===
        receiverPubkey.toString()
      ) {
        receiverIndex = i;
        break;
      }
    }

    if (receiverIndex === -1) {
      await recordPaymentTransaction({
        wallet_address: walletAddress,
        transaction_signature: transactionSignature,
        amount_sol: 0,
        messages_credited: 0,
        status: 'failed',
      });

      return NextResponse.json(
        {
          error: `Payment receiver wallet not found in transaction. Expected: ${paymentReceiverWallet}`,
        },
        { status: 400 }
      );
    }

    // Calculate amount transferred
    const amountLamports = postBalances[receiverIndex] - preBalances[receiverIndex];
    const amountSOL = amountLamports / LAMPORTS_PER_SOL;

    // Verify amount is at least 0.3 SOL (allow small variance for fees)
    const minAcceptableAmount = PAYMENT_AMOUNT_SOL * 0.98; // 2% tolerance
    if (amountSOL < minAcceptableAmount) {
      await recordPaymentTransaction({
        wallet_address: walletAddress,
        transaction_signature: transactionSignature,
        amount_sol: amountSOL,
        messages_credited: 0,
        status: 'failed',
      });

      return NextResponse.json(
        {
          error: `Insufficient payment amount. Required: ${PAYMENT_AMOUNT_SOL} SOL, Received: ${amountSOL.toFixed(4)} SOL`,
        },
        { status: 400 }
      );
    }

    // Payment verified! Credit the user
    try {
      await addMessageCredits(walletAddress, MESSAGES_PER_PAYMENT);

      await recordPaymentTransaction({
        wallet_address: walletAddress,
        transaction_signature: transactionSignature,
        amount_sol: amountSOL,
        messages_credited: MESSAGES_PER_PAYMENT,
        status: 'verified',
        verified_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Successfully added ${MESSAGES_PER_PAYMENT} messages to your account`,
        messagesAdded: MESSAGES_PER_PAYMENT,
        amountPaid: amountSOL,
        signature: transactionSignature,
      });
    } catch (error) {
      console.error('Error crediting user:', error);
      return NextResponse.json(
        { error: 'Failed to credit messages to account' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Payment API error:', error);

    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Payment verification error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
