import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

const TOKEN_MINT_ADDRESS = 'GDTCMCQ8Zs5vnVPPDjSYciZJ67YcrCbnP31WGuUvL8Kj';
const REWARD_AMOUNT = 1; // Number of CHAT tokens to reward per message
const MIN_FAUCET_SOL_BALANCE = 0.01; // Minimum SOL balance for faucet to operate (for transaction fees)

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get faucet private key from environment
    const faucetPrivateKey = process.env.FAUCET_PRIVATE_KEY;
    if (!faucetPrivateKey) {
      return NextResponse.json(
        { error: 'Faucet private key not configured' },
        { status: 500 }
      );
    }

    // Connect to Solana network (from environment variable)
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl = network === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : network === 'testnet'
      ? 'https://api.testnet.solana.com'
      : 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');

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
          { error: 'Invalid faucet private key format' },
          { status: 500 }
        );
      }
    }

    // Check faucet SOL balance (needed for transaction fees)
    const faucetBalance = await connection.getBalance(faucetKeypair.publicKey);
    const faucetBalanceSOL = faucetBalance / LAMPORTS_PER_SOL;

    if (faucetBalanceSOL < MIN_FAUCET_SOL_BALANCE) {
      console.error('Faucet SOL balance too low:', {
        current: faucetBalanceSOL,
        minimum: MIN_FAUCET_SOL_BALANCE
      });
      return NextResponse.json(
        { error: 'Reward system temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Get token mint public key
    const tokenMint = new PublicKey(TOKEN_MINT_ADDRESS);

    // Get or create associated token account for faucet (sender)
    const faucetTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      faucetKeypair,
      tokenMint,
      faucetKeypair.publicKey
    );

    // Check faucet token balance
    const faucetTokenBalance = await getAccount(connection, faucetTokenAccount.address);
    const faucetTokenAmount = Number(faucetTokenBalance.amount);

    if (faucetTokenAmount < REWARD_AMOUNT) {
      console.error('Faucet token balance too low:', {
        current: faucetTokenAmount,
        required: REWARD_AMOUNT
      });
      return NextResponse.json(
        { error: 'Reward tokens temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    // Validate recipient address
    let recipientPubkey: PublicKey;
    try {
      recipientPubkey = new PublicKey(walletAddress);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Get or create associated token account for recipient
    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      faucetKeypair,
      tokenMint,
      recipientPubkey
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      faucetTokenAccount.address,
      recipientTokenAccount.address,
      faucetKeypair.publicKey,
      REWARD_AMOUNT,
      [],
      TOKEN_PROGRAM_ID
    );

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = faucetKeypair.publicKey;

    // Send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [faucetKeypair],
      { 
        commitment: 'confirmed',
        maxRetries: 3
      }
    );

    return NextResponse.json({
      success: true,
      signature,
      amount: REWARD_AMOUNT,
      tokenMint: TOKEN_MINT_ADDRESS,
    });
  } catch (error: any) {
    console.error('Reward API error:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    // Provide user-friendly error messages
    let userMessage = 'Failed to send reward. Please try again.';

    if (error.message?.includes('Blockhash not found')) {
      userMessage = 'Network congestion detected. Please try again in a moment.';
    } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
      userMessage = 'Network timeout. Please check your connection and try again.';
    }

    return NextResponse.json(
      { error: userMessage, details: error.message },
      { status: 500 }
    );
  }
}

