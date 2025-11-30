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

    // Connect to Solana Devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

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
      return NextResponse.json(
        { error: `Faucet SOL balance too low. Current: ${faucetBalanceSOL.toFixed(4)} SOL. Minimum required: ${MIN_FAUCET_SOL_BALANCE} SOL for transaction fees` },
        { status: 400 }
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
      return NextResponse.json(
        { error: `Faucet token balance too low. Current: ${faucetTokenAmount} tokens. Required: ${REWARD_AMOUNT} tokens` },
        { status: 400 }
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
    console.error('Reward API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send reward' },
      { status: 500 }
    );
  }
}

