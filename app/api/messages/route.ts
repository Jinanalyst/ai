import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const sessionId = searchParams.get('sessionId');

    if (!walletAddress || !sessionId) {
      return NextResponse.json(
        { error: 'Wallet address and session ID are required' },
        { status: 400 }
      );
    }

    const messagesKey = `messages:${walletAddress}:${sessionId}`;
    const messages = await kv.get(messagesKey) || [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, sessionId, messages } = body;

    if (!walletAddress || !sessionId) {
      return NextResponse.json(
        { error: 'Wallet address and session ID are required' },
        { status: 400 }
      );
    }

    const messagesKey = `messages:${walletAddress}:${sessionId}`;
    await kv.set(messagesKey, messages);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving messages:', error);
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    );
  }
}
