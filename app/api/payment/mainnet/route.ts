import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';

// Mainnet configuration
const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const MIN_PAYMENT_AMOUNT = 0.001; // Minimum SOL to send
const PAYMENT_AMOUNT = 0.001; // Payment amount in SOL per connection
const MIN_FAUCET_SOL_BALANCE = 0.01; // Minimum SOL balance for faucet

interface PaymentRequest {
  walletAddress: string;
  memo?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const { walletAddress, memo } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Get faucet private key from environment
    const faucetPrivateKey = process.env.MAINNET_FAUCET_PRIVATE_KEY;
    if (!faucetPrivateKey) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Create keypair from private key
    let faucetKeypair: Keypair;
    try {
      // Try to decode as base58 first (common format)
      const privateKeyBytes = bs58.decode(faucetPrivateKey);
      faucetKeypair = Keypair.fromSecretKey(privateKeyBytes);
    } catch {
      // If base58 fails, try as JSON array
      try {
        const privateKeyArray = JSON.parse(faucetPrivateKey);
        faucetKeypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
      } catch {
        return NextResponse.json(
          { error: 'Invalid payment gateway configuration' },
          { status: 500 }
        );
      }
    }

    // Connect to Solana Mainnet
    const connection = new Connection(MAINNET_RPC, 'confirmed');

    // Check faucet SOL balance
    const faucetBalance = await connection.getBalance(faucetKeypair.publicKey);
    const faucetBalanceSOL = faucetBalance / LAMPORTS_PER_SOL;

    if (faucetBalanceSOL < MIN_FAUCET_SOL_BALANCE) {
      return NextResponse.json(
        {
          error: `Payment gateway balance insufficient. Current: ${faucetBalanceSOL.toFixed(6)} SOL. Required minimum: ${MIN_FAUCET_SOL_BALANCE} SOL`,
          balance: faucetBalanceSOL,
          required: MIN_FAUCET_SOL_BALANCE
        },
        { status: 400 }
      );
    }

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // Create memo instruction with transaction identifier
    const memoProgram = new PublicKey('MemoSq4gDiRvZn2rRQZwuNjBtmnvuJ7FSZiAZgnAXJ');
    const memoData = Buffer.from(
      memo || `solana-chat-payment-${Date.now()}`,
      'utf-8'
    );

    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: faucetKeypair.publicKey, isSigner: true, isWritable: true }],
      programId: memoProgram,
      data: memoData,
    });

    // Create SOL transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: faucetKeypair.publicKey,
      toPubkey: recipientPubkey,
      lamports: PAYMENT_AMOUNT * LAMPORTS_PER_SOL,
    });

    // Create transaction with both memo and transfer
    const transaction = new Transaction()
      .add(memoInstruction)
      .add(transferInstruction);

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = faucetKeypair.publicKey;

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [faucetKeypair],
      {
        commitment: 'confirmed',
        maxRetries: 3
      }
    );

    // Create hash/identifier for tracking
    const paymentId = `${signature.substring(0, 8)}-${walletAddress.substring(0, 8)}`;

    return NextResponse.json({
      success: true,
      signature,
      paymentId,
      amount: PAYMENT_AMOUNT,
      currency: 'SOL',
      network: 'mainnet-beta',
      recipientAddress: walletAddress,
      faucetAddress: faucetKeypair.publicKey.toString(),
      memo: memo || `solana-chat-payment-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Mainnet payment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process mainnet payment' },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status by signature
export async function GET(request: NextRequest) {
  try {
    const signature = request.nextUrl.searchParams.get('signature');
    const walletAddress = request.nextUrl.searchParams.get('wallet');

    if (!signature || !walletAddress) {
      return NextResponse.json(
        { error: 'Signature and wallet address are required' },
        { status: 400 }
      );
    }

    // Connect to Solana Mainnet
    const connection = new Connection(MAINNET_RPC, 'confirmed');

    // Get transaction details
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Extract memo from instructions
    const memoProgram = new PublicKey('MemoSq4gDiRvZn2rRQZwuNjBtmnvuJ7FSZiAZgnAXJ');
    let memo = '';

    if (transaction.transaction.message.instructions) {
      for (const instruction of transaction.transaction.message.instructions) {
        if (instruction.programId.toString() === memoProgram.toString()) {
          if ('data' in instruction) {
            memo = instruction.data?.toString('utf-8') || '';
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      signature,
      memo,
      confirmed: transaction.blockTime !== undefined,
      slot: transaction.slot,
      timestamp: transaction.blockTime ? new Date(transaction.blockTime * 1000).toISOString() : null,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
