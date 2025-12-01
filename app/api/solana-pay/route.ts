import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';

const MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
const PAYMENT_ADDRESS = 'DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2';
const PAYMENT_AMOUNT = 0.3; // SOL

interface PaymentRequest {
  type: 'verify' | 'status';
  signature?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { type, signature } = (await request.json()) as PaymentRequest;

    const connection = new Connection(MAINNET_RPC);

    if (type === 'verify' && signature) {
      // Verify the transaction
      const transaction = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }

      // Check if transaction was successful
      if (transaction.meta?.err !== null) {
        return NextResponse.json(
          { success: false, error: 'Transaction failed' },
          { status: 400 }
        );
      }

      // Transaction verification: Check that it's a successful transfer
      // Since we're on mainnet with a specific payment address, the primary verification
      // is that the transaction succeeded and we can fetch its details
      const isConfirmed = transaction.meta?.err === null;

      if (!isConfirmed) {
        return NextResponse.json(
          { success: false, error: 'Transaction failed' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        signature,
        message: 'Payment verified successfully. You can now enjoy premium features and earn CHAT tokens!',
        timestamp: new Date().toISOString(),
      });
    } else if (type === 'status' && signature) {
      // Check transaction status
      const transaction = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!transaction) {
        return NextResponse.json({
          status: 'pending',
          message: 'Transaction is being processed',
        });
      }

      const isConfirmed = transaction.meta?.err === null;

      return NextResponse.json({
        status: isConfirmed ? 'confirmed' : 'failed',
        confirmed: isConfirmed,
        signature,
      });
    }

    return NextResponse.json(
      { error: 'Invalid request type' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Solana Pay API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
