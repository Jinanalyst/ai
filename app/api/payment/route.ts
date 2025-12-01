import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

// Platform wallet address (replace with your actual wallet)
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || 'PLATFORM_WALLET_NOT_SET';
const PAYMENT_AMOUNT = 0.1; // 0.1 SOL required to access the platform

export async function POST(request: NextRequest) {
  try {
    const { signature, walletAddress } = await request.json();

    if (!signature || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing signature or wallet address' },
        { status: 400 }
      );
    }

    // Connect to Solana network
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Verify the transaction
    const transaction = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify transaction is confirmed
    if (!transaction.meta || transaction.meta.err) {
      return NextResponse.json(
        { error: 'Transaction failed or not confirmed' },
        { status: 400 }
      );
    }

    // Verify the transaction involves the correct wallets and amount
    const fromPubkey = transaction.transaction.message.getAccountKeys().get(0);
    const toPubkey = transaction.transaction.message.getAccountKeys().get(1);

    if (!fromPubkey || !toPubkey) {
      return NextResponse.json(
        { error: 'Invalid transaction structure' },
        { status: 400 }
      );
    }

    // Verify sender is the claimed wallet
    if (fromPubkey.toString() !== walletAddress) {
      return NextResponse.json(
        { error: 'Transaction sender does not match wallet address' },
        { status: 400 }
      );
    }

    // Verify recipient is the platform wallet
    if (PLATFORM_WALLET !== 'PLATFORM_WALLET_NOT_SET' && toPubkey.toString() !== PLATFORM_WALLET) {
      return NextResponse.json(
        { error: 'Transaction recipient is not the platform wallet' },
        { status: 400 }
      );
    }

    // Calculate amount transferred
    const preBalance = transaction.meta.preBalances[0];
    const postBalance = transaction.meta.postBalances[0];
    const amountTransferred = (preBalance - postBalance) / LAMPORTS_PER_SOL;

    // Verify amount is sufficient
    if (amountTransferred < PAYMENT_AMOUNT) {
      return NextResponse.json(
        {
          error: `Insufficient payment. Required: ${PAYMENT_AMOUNT} SOL, Received: ${amountTransferred} SOL`
        },
        { status: 400 }
      );
    }

    // Payment verified successfully
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      walletAddress,
      amount: amountTransferred,
      signature,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // For this implementation, we'll check if the wallet has any recent transactions
    // to the platform wallet. In production, you'd want to use a database.
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    try {
      const publicKey = new PublicKey(walletAddress);

      // Get recent transactions for this wallet
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 50,
      });

      // For MVP: if wallet has any confirmed transactions, consider it paid
      // In production, you should verify specific payment transactions to your platform wallet
      const hasPaid = signatures.length > 0;

      return NextResponse.json({
        hasPaid,
        message: hasPaid ? 'Payment verified' : 'No payment found',
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Payment check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
