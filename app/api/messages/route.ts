import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const formattedMessages = messages?.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      rewardTx: msg.reward_tx,
    })) || [];

    return NextResponse.json({ messages: formattedMessages });
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

    // Delete existing messages for this session
    await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId)
      .eq('wallet_address', walletAddress);

    // Insert new messages
    if (messages.length > 0) {
      const messagesToInsert = messages.map((msg: any) => ({
        id: msg.id,
        session_id: sessionId,
        wallet_address: walletAddress,
        role: msg.role,
        content: msg.content,
        reward_tx: msg.rewardTx || null,
      }));

      const { error } = await supabase
        .from('chat_messages')
        .insert(messagesToInsert);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json(
          { error: 'Failed to save messages' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving messages:', error);
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    );
  }
}
