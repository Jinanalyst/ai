import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58';

const TOKEN_MINT_ADDRESS = 'GDTCMCQ8Zs5vnVPPDjSYciZJ67YcrCbnP31WGuUvL8Kj';
const REWARD_AMOUNT = 1; // Number of full CHAT tokens to reward per message
const MIN_FAUCET_SOL_BALANCE = 0.05; // Minimum SOL balance for faucet to operate (increased for reliability)

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

    // Connect to Solana network based on environment variable
    const networkEnv = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const rpcUrl = networkEnv === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : networkEnv === 'testnet'
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
      return NextResponse.json(
        { error: `Faucet SOL balance too low. Current: ${faucetBalanceSOL.toFixed(4)} SOL. Minimum required: ${MIN_FAUCET_SOL_BALANCE} SOL for transaction fees` },
        { status: 400 }
      );
    }

    // Get token mint public key
    const tokenMint = new PublicKey(TOKEN_MINT_ADDRESS);

    // Fetch mint information to get decimals
    const mintInfo = await getMint(connection, tokenMint);
    const tokenDecimals = mintInfo.decimals;

    // Calculate actual amount to transfer (account for decimals)
    const transferAmount = REWARD_AMOUNT * Math.pow(10, tokenDecimals);

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

    if (faucetTokenAmount < transferAmount) {
      const currentBalance = faucetTokenAmount / Math.pow(10, tokenDecimals);
      return NextResponse.json(
        { error: `Faucet token balance too low. Current: ${currentBalance.toFixed(tokenDecimals)} tokens. Required: ${REWARD_AMOUNT} tokens` },
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
      transferAmount,
      [],
      TOKEN_PROGRAM_ID
    );

    // Create transaction
    const transaction = new Transaction().add(transferInstruction);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = faucetKeypair.publicKey;

    // Send transaction with increased retries for better reliability
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [faucetKeypair],
      {
        commitment: 'confirmed',
        maxRetries: 5
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

    // Provide specific error messages based on error type
    let errorMessage = 'Failed to send reward';
    let statusCode = 500;

    if (error.message) {
      const msg = error.message.toLowerCase();

      // Network/connection errors
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout')) {
        errorMessage = 'Network error: Unable to connect to Solana network. Please try again.';
        statusCode = 503;
      }
      // Transaction errors
      else if (msg.includes('transaction') || msg.includes('blockhash')) {
        errorMessage = 'Transaction failed: Unable to process blockchain transaction. Please try again.';
        statusCode = 500;
      }
      // Balance errors
      else if (msg.includes('insufficient') || msg.includes('balance')) {
        errorMessage = 'Insufficient balance: Faucet does not have enough tokens or SOL for transaction fees.';
        statusCode = 400;
      }
      // Invalid address
      else if (msg.includes('invalid') && msg.includes('address')) {
        errorMessage = 'Invalid wallet address provided.';
        statusCode = 400;
      }
      // Token account errors
      else if (msg.includes('token account')) {
        errorMessage = 'Token account error: Unable to create or access token account.';
        statusCode = 500;
      }
      // Generic fallback with actual error
      else {
        errorMessage = `Reward error: ${error.message}`;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

