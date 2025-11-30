import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful, friendly AI assistant. Keep responses concise and clear. Avoid overly long explanations.',
          },
          ...history,
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      let errorMessage = 'Failed to get AI response';
      try {
        const parsedError = JSON.parse(errorData);
        errorMessage = parsedError.error?.message || parsedError.error || errorMessage;
      } catch {
        errorMessage = errorData || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status || 500 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response received';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

