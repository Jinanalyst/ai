import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    // Build messages array for Anthropic API
    const messages = [
      ...history,
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: 'You are a helpful, friendly AI assistant. Keep responses concise and clear. Avoid overly long explanations.',
      messages: messages,
    });

    // Extract the response text
    let reply = 'No response received';
    if (response.content && response.content.length > 0) {
      const content = response.content[0];
      if ('text' in content) {
        reply = content.text.trim();
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);

    // Provide better error messages for common API errors
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

