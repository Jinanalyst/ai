import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const sessionsKey = `sessions:${walletAddress}`;
    const sessions = await kv.get(sessionsKey) || [];

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, sessions } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const sessionsKey = `sessions:${walletAddress}`;
    await kv.set(sessionsKey, sessions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving sessions:', error);
    return NextResponse.json(
      { error: 'Failed to save sessions' },
      { status: 500 }
    );
  }
}
