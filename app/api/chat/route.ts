import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUserCredits, deductMessageCredit } from '@/lib/supabase';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], walletAddress } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Check if user has message credits
    try {
      const credits = await getUserCredits(walletAddress);
      if (!credits || credits.messages_remaining <= 0) {
        return NextResponse.json(
          {
            error: 'Insufficient message credits. Please purchase more messages.',
            code: 'INSUFFICIENT_CREDITS',
            messagesRemaining: 0,
          },
          { status: 402 }
        );
      }
    } catch (error) {
      console.error('Error checking credits:', error);
      return NextResponse.json(
        { error: 'Failed to check message credits' },
        { status: 500 }
      );
    }

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.length < 10) {
      return NextResponse.json(
        { error: 'AI API key not configured or invalid. Please check your ANTHROPIC_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Build conversation messages for Anthropic format
    const messages: Anthropic.MessageParam[] = [];

    // Add history
    history.forEach((msg: { role: string; content: string }) => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    });

    // Add current message
    messages.push({
      role: 'user',
      content: message,
    });

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for Anthropic

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'You are a helpful, friendly AI assistant. Keep responses concise and clear. Avoid overly long explanations.',
        messages: messages,
      }, {
        signal: controller.signal as AbortSignal,
      });

      clearTimeout(timeoutId);

      // Extract the reply from Anthropic response
      let reply = 'No response received';
      if (response.content && response.content.length > 0) {
        const textContent = response.content.find((block) => block.type === 'text');
        if (textContent && textContent.type === 'text') {
          reply = textContent.text;
        }
      }

      // Deduct message credit after successful response
      try {
        await deductMessageCredit(walletAddress);
      } catch (error) {
        console.error('Error deducting message credit:', error);
        // Don't fail the request if credit deduction fails, just log it
      }

      return NextResponse.json({ reply });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout: The AI service took too long to respond. Please try again.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error('Chat API error:', error);

    // Handle Anthropic-specific errors
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Anthropic.APIError) {
      errorMessage = error.message || 'AI service error';
      statusCode = error.status || 500;

      // Provide more specific error messages
      if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.';
      } else if (error.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.status === 529) {
        errorMessage = 'AI service is overloaded. Please try again in a moment.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Chat API error: ${errorMessage}` },
      { status: statusCode }
    );
  }
}
