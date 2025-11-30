import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const formattedSessions = sessions?.map(session => ({
      id: session.id,
      title: session.title,
      timestamp: new Date(session.updated_at).getTime(),
      messageCount: session.message_count,
    })) || [];

    return NextResponse.json({ sessions: formattedSessions });
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

    // Upsert all sessions
    const sessionsToUpsert = sessions.map((session: any, index: number) => ({
      id: session.id,
      wallet_address: walletAddress,
      title: session.title,
      message_count: session.messageCount,
      updated_at: new Date(session.timestamp).toISOString(),
      display_order: index,
    }));

    const { error } = await supabase
      .from('chat_sessions')
      .upsert(sessionsToUpsert, {
        onConflict: 'id',
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving sessions:', error);
    return NextResponse.json(
      { error: 'Failed to save sessions' },
      { status: 500 }
    );
  }
}
